module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '7c59bfe12b2a3c7dd1152c450fc90987'),
  },
});
