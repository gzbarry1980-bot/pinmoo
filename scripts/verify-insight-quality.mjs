import { insightAuthor, insightClusters, insights } from '../src/data/insights.js';
import { leadPages } from '../src/data/lead-pages.js';

const failures = [];
const warnings = [];
const seenSlugs = new Set();
const seenTitles = new Set();
const validServices = new Set(leadPages.map((page) => page.slug));
const clusterCategories = new Set(insightClusters.flatMap((cluster) => cluster.categories));
if (!insightAuthor.disclosure?.includes('AI参与') || !insightAuthor.disclosure?.includes('最终由鲍俊文复核')) {
  fail('文章作者信息缺少 AI 参与和人工复核声明');
}

function fail(message) {
  failures.push(message);
}

function textLength(value) {
  return JSON.stringify(value).replace(/\s/g, '').length;
}

for (const article of insights) {
  const label = article.slug || '(missing slug)';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug || '')) fail(`${label}: slug 格式不正确`);
  if (seenSlugs.has(article.slug)) fail(`${label}: slug 重复`);
  if (seenTitles.has(article.title)) fail(`${label}: title 重复`);
  seenSlugs.add(article.slug);
  seenTitles.add(article.title);

  for (const field of ['category', 'title', 'shortTitle', 'summary', 'metaTitle', 'metaDescription', 'published', 'updated', 'readTime', 'directAnswer', 'conclusion']) {
    if (!article[field]) fail(`${label}: 缺少 ${field}`);
  }
  if (!clusterCategories.has(article.category)) fail(`${label}: category 未进入任何主题簇`);
  if (article.contentModel !== 'CEBA') fail(`${label}: contentModel 必须为 CEBA`);
  if (article.reviewStatus !== 'editorially-reviewed') fail(`${label}: 未标记编辑复核状态`);
  if (!article.businessIntent) fail(`${label}: 缺少商业搜索意图`);
  if (!Array.isArray(article.probeIds)) fail(`${label}: probeIds 必须为数组`);

  if (!article.evidence?.basis || !article.evidence?.scope || !article.evidence?.limits) fail(`${label}: 证据、适用范围或限制不完整`);
  if (article.directAnswer.length < 60) fail(`${label}: 直接回答过短`);
  if (!Array.isArray(article.keyPoints) || article.keyPoints.length < 4) fail(`${label}: 关键点不足 4 条`);
  if (!Array.isArray(article.sections) || article.sections.length < 4) fail(`${label}: 正文章节不足 4 节`);
  if (textLength(article.sections) < 800) fail(`${label}: 正文信息量不足`);
  if (!Array.isArray(article.faqs) || article.faqs.length < 2) fail(`${label}: FAQ 不足 2 条`);
  if (!Array.isArray(article.relatedServices) || article.relatedServices.length < 1) fail(`${label}: 缺少服务内链`);

  const sectionIds = new Set();
  for (const section of article.sections || []) {
    if (!section.id || sectionIds.has(section.id)) fail(`${label}: 章节 id 缺失或重复`);
    sectionIds.add(section.id);
    if (!section.title || !Array.isArray(section.paragraphs) || !section.paragraphs.length) fail(`${label}: 章节内容不完整`);
    if (section.table && section.table.rows.some((row) => row.length !== section.table.headers.length)) fail(`${label}: 表格列数不一致`);
  }

  for (const slug of article.relatedServices || []) {
    if (!validServices.has(slug)) fail(`${label}: 服务内链不存在 ${slug}`);
  }

  const serialized = JSON.stringify(article);
  for (const risky of ['50+ 品牌项目', '行业领先', '前天猫服务站', '淘宝大学培训基地']) {
    if (serialized.includes(risky)) fail(`${label}: 包含未核验声明“${risky}”`);
  }
  if (!article.probeIds.length) warnings.push(`${label}: 尚未绑定固定探针 ID`);
}

const featuredCount = insights.filter((article) => article.featured).length;
if (featuredCount !== 6) fail(`首页精选文章应为 6 篇，当前 ${featuredCount} 篇`);

if (failures.length) {
  console.error(`内容质量检查失败，共 ${failures.length} 项：`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`内容质量检查通过：${insights.length} 篇文章，${insightClusters.length} 个主题簇，${featuredCount} 篇首页精选。`);
if (warnings.length) console.log(`提示：${warnings.length} 篇历史文章待绑定固定探针 ID。`);
