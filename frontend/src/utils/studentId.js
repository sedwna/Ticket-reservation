const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

export const normalizeStudentID = (value = '') => value
  .trim()
  .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
  .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));

export const getStudentIDValidationError = (value) => {
  const studentID = normalizeStudentID(value);
  if (!studentID) return 'شماره دانشجویی الزامی است';
  if (!/^[0-9]+$/.test(studentID)) return 'شماره دانشجویی باید فقط عدد باشد';
  if (studentID.length < 10) return 'شماره دانشجویی باید حداقل ۱۰ رقم باشد';
  if (studentID.length > 20) return 'شماره دانشجویی نمی‌تواند بیشتر از ۲۰ رقم باشد';
  return '';
};
