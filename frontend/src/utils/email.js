const localPartPattern = /^[a-z0-9.!#$%&'*+/=?^_{|}~-]+$/;
const domainLabelPattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export const normalizeEmail = (value = '') => value.trim().toLocaleLowerCase('en-US');

export const getEmailValidationError = (value) => {
  const email = normalizeEmail(value);
  if (!email) return 'ایمیل الزامی است';
  if (email.length > 254 || (email.match(/@/g) || []).length !== 1) {
    return 'ساختار ایمیل معتبر نیست';
  }

  const [localPart, domain] = email.split('@');
  if (
    !localPart
    || localPart.length > 64
    || localPart.startsWith('.')
    || localPart.endsWith('.')
    || localPart.includes('..')
    || !localPartPattern.test(localPart)
  ) {
    return 'ساختار ایمیل معتبر نیست';
  }

  const labels = domain.split('.');
  if (
    domain.length > 253
    || domain.includes('..')
    || labels.length < 2
    || labels.at(-1).length < 2
    || labels.some((label) => !domainLabelPattern.test(label))
  ) {
    return 'دامنه ایمیل معتبر نیست';
  }

  return '';
};
