import * as yup from 'yup';

export const passwordValidation = yup.object().shape({
  password: yup
    .string()
    .min(8)
    .required(),
});

export default yup.object().shape({
  email: yup
    .string()
    .email()
    .required(),
  password: yup
    .string()
    .min(8)
    .required(),
});
