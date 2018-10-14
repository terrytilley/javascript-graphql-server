import * as yup from 'yup';

const email = {
  email: yup
    .string()
    .email()
    .required(),
};

const password = {
  password: yup
    .string()
    .min(8)
    .required(),
};

export const passwordValidation = yup.object().shape({ ...password });

export default yup.object().shape({
  ...email,
  ...password,
});
