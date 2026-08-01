/* 正式序列号和设备绑定仅保存在服务端；本页访问密码由 Nginx 验证。 */
(function () {
  'use strict';
  var currentFilter = 'all';
  var records = [];
  var toastTimer = null;

  function normalizeCode(value) { return String(value || '').replace(/[\s-]/g, '').toUpperCase(); }
  async function request(path, options) {
    var config = options || {};
    var response = await fetch(path, Object.assign({ credentials: 'include' }, config, { headers: Object.assign({}, config.headers || {}) }));
    var body = await response.json().catch(function () { return {}; });
    if (!response.ok) throw Object.assign(new Error(body.error || '服务请求失败。'), { status: response.status, body: body });
    return body;
  }
  function showToast(message, type) {
    var element = document.getElementById('toast');
    element.textContent = message;
    element.className = 'toast' + (type ? ' toast-' + type : '');
    void element.offsetWidth;
    element.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { element.classList.remove('show'); }, 2400);
  }
  function formatTime(value) { return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') : '—'; }
  function updateConnection(message, connected) {
    var element = document.getElementById('connectionStatus');
    element.textContent = message;
    element.dataset.connected = connected ? 'true' : 'false';
  }
  async function refresh() {
    var data = await request('/api/serial-keys');
    records = Array.isArray(data.records) ? data.records : [];
    render();
  }
  function render() {
    var activeList = document.getElementById('activeList');
    var tbody = document.getElementById('keyTableBody');
    var empty = document.getElementById('emptyState');
    activeList.innerHTML = '';
    records.filter(function (record) { return record.status === 'active'; }).forEach(function (record) {
      var tag = document.createElement('span');
      tag.className = 'active-tag';
      tag.textContent = record.code + ' · ' + record.deviceCount + '/2';
      tag.title = '点击填入作废输入框';
      tag.addEventListener('click', function () { document.getElementById('invalidateInput').value = record.code; });
      activeList.appendChild(tag);
    });
    var filtered = records.filter(function (record) { return currentFilter === 'all' || record.status === currentFilter; });
    tbody.innerHTML = '';
    empty.classList.toggle('hidden', filtered.length > 0);
    filtered.forEach(function (record) {
      var row = document.createElement('tr');
      row.innerHTML = '<td class="code-cell"></td><td><span class="status-tag"></span></td><td></td><td></td>';
      row.children[0].textContent = record.code;
      var status = row.querySelector('.status-tag');
      status.className = 'status-tag ' + (record.status === 'active' ? 'status-active' : 'status-invalid');
      status.textContent = record.status === 'active' ? '有效 ' + record.deviceCount + '/2 台' : '已作废';
      row.children[2].textContent = formatTime(record.createdAt);
      row.children[3].textContent = formatTime(record.invalidatedAt);
      tbody.appendChild(row);
    });
  }
  function copyText(value) { return navigator.clipboard?.writeText(value).then(function () { return true; }, function () { return false; }) || Promise.resolve(false); }
  function bindEvents() {
    document.getElementById('generateBtn').addEventListener('click', async function () {
      try {
        var data = await request('/api/serial-keys/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 1 }) });
        var code = data.records[0].code;
        document.getElementById('generatedCode').textContent = code;
        document.getElementById('resultBox').classList.remove('hidden');
        await refresh();
        showToast('已生成正式序列号。', 'success');
      } catch (error) { showToast(error.message, 'error'); }
    });
    document.getElementById('copyBtn').addEventListener('click', function () {
      var code = document.getElementById('generatedCode').textContent;
      if (code) copyText(code).then(function (ok) { showToast(ok ? '已复制序列号。' : '复制失败，请手动复制。', ok ? 'success' : 'error'); });
    });
    document.getElementById('invalidateBtn').addEventListener('click', async function () {
      var input = document.getElementById('invalidateInput');
      var code = normalizeCode(input.value);
      if (!/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{10}$/.test(code)) return showToast('请输入正确的 10 位序列号。', 'error');
      if (!window.confirm('确认作废 ' + code + ' 吗？已绑定的设备也将无法继续使用。')) return;
      try {
        await request('/api/serial-keys/' + code + '/invalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        input.value = '';
        await refresh();
        showToast('序列号已作废。', 'success');
      } catch (error) { showToast(error.message, 'error'); }
    });
    document.getElementById('filterGroup').addEventListener('click', function (event) {
      var button = event.target.closest('.chip');
      if (!button) return;
      currentFilter = button.dataset.filter;
      document.querySelectorAll('#filterGroup .chip').forEach(function (item) { item.classList.toggle('active', item === button); });
      render();
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    var legacyKeyInput = document.getElementById('adminApiKey');
    if (legacyKeyInput) {
      var authCard = legacyKeyInput.closest('.card');
      legacyKeyInput.closest('.inline-form')?.remove();
      authCard.querySelector('.card-title').textContent = '页面管理验证';
      authCard.querySelector('.card-hint').textContent = '进入本页时已完成独立管理密码验证；无需重复粘贴管理密钥。';
    }
    bindEvents();
    refresh().then(function () {
      updateConnection('已通过页面管理密码验证，正式序列号和设备绑定均由服务端保存。', true);
    }).catch(function (error) {
      records = [];
      render();
      updateConnection('页面管理会话失效，请刷新页面后重新输入页面密码。', false);
      showToast(error.message, 'error');
    });
  });
})();
