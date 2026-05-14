export function DashboardVisual() {
  return (
    <div className="dashboard-visual" aria-label="电商数据看板示意图">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="growth-arrow" />
      <div className="metric-card metric-main">
        <span>销售额趋势</span>
        <strong>¥ 12,880,560</strong>
        <em>+28.6%</em>
        <svg viewBox="0 0 260 80" role="img" aria-label="增长趋势线"><polyline points="6,62 38,48 70,52 102,45 136,50 170,38 205,34 250,12" fill="none" stroke="#255BFF" strokeWidth="5" strokeLinecap="round"/><path d="M6 72 C70 38,120 72,250 22 L250 80 L6 80 Z" fill="rgba(74,91,255,.12)"/></svg>
      </div>
      <div className="metric-card metric-roi"><span>ROI</span><strong>4.35</strong><em>+18.4%</em></div>
      <div className="metric-card metric-donut"><span>渠道占比</span><div className="donut" /></div>
      <div className="metric-card metric-rate"><span>转化率</span><strong>3.27%</strong><div className="bars"><i/><i/><i/><i/><i/></div></div>
    </div>
  );
}
