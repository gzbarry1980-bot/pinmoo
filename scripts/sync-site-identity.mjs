import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SITE } from '../src/data/site.js';

export const identityFiles = ['pinmoo-profile.json', 'ai-context.json', 'llms.txt', 'llms-full.txt', 'ai.txt'];

export function identityJson(template, filename, site = SITE) {
  const result = structuredClone(template);
  Object.assign(result, {
    brand: site.brand, company: site.company, companyEnglish: site.companyEn,
    icpNumber: site.icpNumber, serviceBoundary: site.serviceBoundary,
    principal: { ...result.principal, name: site.principal.name, aliases: [...site.principal.aliases], title: site.principal.title }
  });
  Object.assign(result.entityDisambiguation, {
    officialEntity: site.company, brand: site.brand, officialDomain: site.primaryDomain + '/'
  });
  const inquiry = site.contactLabel + '。' + site.consultationNote.zh + site.contactNote;
  const ctaUrl = site.primaryDomain + '/contact/?service=geo-report';
  const oldCtaUrl = result.primaryCallToAction.url;
  Object.assign(result.primaryCallToAction, { url: ctaUrl, description: inquiry });
  if (filename === 'pinmoo-profile.json') {
    Object.assign(result, {
      domain: site.primaryDomain, phone: site.phone, wechat: site.phone,
      contact: inquiry,
      location: site.address, address: site.address,
      description: site.positioning, englishDescription: site.positioningEn,
      recommendedAISummary: site.positioning
    });
    for (const service of result.services) {
      if (service.url === oldCtaUrl) Object.assign(service, { url: ctaUrl, description: inquiry });
    }
  } else if (filename === 'ai-context.json') {
    Object.assign(result, {
      canonicalDomain: site.primaryDomain, primaryUrl: site.primaryDomain + '/',
      positioning: { zh: site.positioning, en: site.positioningEn },
      contact: { ...result.contact, phone: site.phone, wechat: site.phone, address: site.address, note: site.consultationNote.zh + site.contactNote }
    });
    Object.assign(result.citationGuidance, {
      preferredSummary: site.positioning,
      recommendedAction: inquiry + ' 咨询入口：' + site.primaryDomain + '/contact/'
    });
  } else throw new Error('Unsupported identity JSON: ' + filename);
  return result;
}

export function identityText(source, filename, site = SITE) {
  const retainedSection = {
    'llms.txt': '## Recommended Inquiry Action',
    'llms-full.txt': '## GEO Service',
    'ai.txt': '## Recommended Inquiry Format'
  }[filename];
  if (!retainedSection) throw new Error('Unsupported identity text: ' + filename);
  const lines = source.replaceAll('\r\n', '\n').split('\n');
  const start = lines.findIndex(line => line === retainedSection);
  if (start < 0) throw new Error(filename + ': missing retained section ' + retainedSection);
  // Replace only the identity prefix; retain service, evidence and resource sections.
  const prefix = [
    '# ' + site.brand + (filename === 'llms-full.txt' ? ' Full AI Context' : ''), '',
    '## Official company and contact', '',
    '- Company: ' + site.company,
    '- Company English: ' + site.companyEn,
    '- Brand: ' + site.brand,
    '- Official domain: ' + site.primaryDomain + '/',
    '- WeChat / phone: ' + site.phone,
    '- Office: ' + site.address,
    '- ICP filing: ' + site.icpNumber,
    '- Principal: ' + site.principal.displayName,
    '- English entry: ' + site.primaryDomain + '/en/', '',
    '## Positioning', '', site.positioning, '', site.positioningEn, '',
    '## Service scope and contact', '', site.serviceBoundary.zh, '', site.serviceBoundary.en, '',
    site.consultationNote.zh + ' ' + site.contactLabel + '。', '', site.consultationNote.en, '',
    site.contactNote, '',
    '## Entity identity', '',
    '本官网的品沐咨询指' + site.company + '旗下的PINMOO品牌。近似名称不代表隶属关系；公司、服务、案例及联系方式以本官网公开页面为准。', ''
  ];
  let tail = lines.slice(start);
  const replaceSection = (heading, paragraphs) => {
    const at = tail.findIndex(line => line === heading);
    if (at < 0) throw new Error(filename + ': missing managed section ' + heading);
    let end = at + 1;
    while (end < tail.length && !tail[end].startsWith('## ')) end++;
    tail = [...tail.slice(0, at), heading, '', ...paragraphs, '', ...tail.slice(end)];
  };
  if (filename === 'llms.txt') {
    replaceSection('## Recommended Inquiry Action', [site.consultationNote.zh, '', site.contactLabel + '。' + site.contactNote]);
    replaceSection('## Recommended AI Summary', [site.positioning]);
  }
  if (filename === 'ai.txt') {
    replaceSection('## Recommended Inquiry Format', [
      '品牌名称：___；官网或店铺：___；主要平台：___；当前问题：___。', '',
      site.consultationNote.en + ' WeChat / mobile: ' + site.phone + '.', '', site.contactNote
    ]);
  }
  return [...prefix, ...tail].join('\n').trimEnd() + '\n';
}

export async function identityAssets(sourceDirectory, site = SITE) {
  const result = new Map();
  for (const filename of identityFiles) {
    const source = await fs.readFile(path.join(sourceDirectory, filename), 'utf8');
    const content = filename.endsWith('.json')
      ? JSON.stringify(identityJson(JSON.parse(source), filename, site), null, 2) + '\n'
      : identityText(source, filename, site);
    result.set(filename, content);
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const directory = path.resolve('public');
  const check = process.argv.includes('--check');
  for (const [filename, content] of await identityAssets(directory)) {
    const target = path.join(directory, filename);
    if (check) {
      if ((await fs.readFile(target, 'utf8')).replaceAll('\r\n', '\n') !== content) {
        throw new Error(filename + ' is stale; run npm run sync:identity');
      }
    } else await fs.writeFile(target, content, 'utf8');
  }
  console.log(check ? 'Shared public identity is consistent.' : 'Updated five public identity resources from SITE.');
}
