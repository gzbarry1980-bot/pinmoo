import { useState } from 'react';
import { PLATFORM_LIST, SITE } from '../data/site.js';
import { Icon } from './Icon.jsx';

const initialForm = {
  name: '',
  company: '',
  phone: '',
  wechat: '',
  platforms: [],
  message: ''
};

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = '请填写姓名';
  if (!form.company.trim()) errors.company = '请填写公司名称';
  if (!form.phone.trim()) errors.phone = '请填写联系电话';
  else if (!/^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/.test(form.phone.trim())) errors.phone = '请输入正确的联系电话';
  return errors;
}

export function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const togglePlatform = (platform) => {
    setForm((current) => {
      const exists = current.platforms.includes(platform);
      return { ...current, platforms: exists ? current.platforms.filter((item) => item !== platform) : [...current.platforms, platform] };
    });
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    setSuccess(false);
    window.setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setForm(initialForm);
    }, 1000);
  };

  return (
    <form className="contact-form" onSubmit={submit} noValidate>
      <div className="form-heading">
        <Icon name="FilePenLine" size={26} />
        <h2>在线咨询 / 领取 GEO 报告</h2>
      </div>
      <label>
        <span>姓名 <b>*</b></span>
        <input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="请输入您的姓名" />
        {errors.name && <em>{errors.name}</em>}
      </label>
      <label>
        <span>公司名称 <b>*</b></span>
        <input value={form.company} onChange={(event) => update('company', event.target.value)} placeholder="请输入公司名称" />
        {errors.company && <em>{errors.company}</em>}
      </label>
      <label>
        <span>联系电话 <b>*</b></span>
        <input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="请输入手机号" inputMode="tel" />
        {errors.phone && <em>{errors.phone}</em>}
      </label>
      <label>
        <span>微信号</span>
        <input value={form.wechat} onChange={(event) => update('wechat', event.target.value)} placeholder="请输入微信号（选填）" />
      </label>
      <fieldset>
        <legend>关注平台</legend>
        <div className="platform-checks">
          {[...PLATFORM_LIST, '其他'].map((platform) => (
            <button type="button" key={platform} className={form.platforms.includes(platform) ? 'selected' : ''} onClick={() => togglePlatform(platform)}>{platform}</button>
          ))}
        </div>
      </fieldset>
      <label>
        <span>咨询需求</span>
        <textarea maxLength={500} value={form.message} onChange={(event) => update('message', event.target.value)} placeholder="如需领取 GEO 报告，请填写品牌官网或店铺链接、主要平台和目标市场" />
      </label>
      <button className="form-submit" type="submit" disabled={loading}>{loading ? '提交中...' : '提交咨询需求'}</button>
      {success && <div className="success-message"><Icon name="CheckCircle2" size={20} />已收到您的需求。你也可以直接添加微信 / 手机同号 {SITE.phoneDisplay}，并注明来意，我们会尽快回复。</div>}
      <p className="form-note"><Icon name="MessageCircle" size={18} />也可以直接添加微信 / 手机同号 <a href={'tel:' + SITE.phone}>{SITE.phoneDisplay}</a>，备注“品牌GEO报告”领取公开信息版基础报告。</p>
    </form>
  );
}
