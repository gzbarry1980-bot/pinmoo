// Enrich descriptive school metadata only; never merge admission histories.
export function enrichSchoolProfiles(schools, controls) {
  const byId = new Map(controls.records.map(r => [r.schoolId, r]));
  const byName = new Map(controls.records.map(r => [r.schoolName, r]));
  const matched = [], unmatched = [];
  for (const school of schools) {
    const canonical = school.name.replace('广东广雅中学（本部校区）', '广东广雅中学（荔湾校区）');
    const row = byId.get(school.id) || byName.get(canonical);
    if (!row) { unmatched.push(school.id); continue; }
    school.administrativeAffiliation = ['省属', '市属'].includes(row.district) ? row.district : `${row.district}属`;
    school.schoolDesignation = row.schoolCategory === '国家级示范性' ? '国家级示范性普通高中'
      : row.schoolCategory === '市示范性' ? '广州市示范性普通高中' : row.schoolCategory;
    school.schoolProfileSourceId = row.sourceId;
    school.schoolProfileYear = row.year;
    if (!school.sourceIds.includes(row.sourceId)) school.sourceIds.push(row.sourceId);
    matched.push(school.id);
  }
  return { matched, unmatched };
}
