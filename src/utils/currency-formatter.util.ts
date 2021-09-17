const formatter = (number) => {
  return new Intl.NumberFormat('vn-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(number);
};

export default formatter;
