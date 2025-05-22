export const validate = (schema) => (req, res, next) => {
  console.log(req.body,'ehllo');

  const result = schema.safeParse(req.body);
  console.log(result);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.errors.map((err) => ({
        path: err.path.length ? err.path.join(".") : "body",
        message: err.message,
      })),
    });
  }

  req.body = result.data;
  next();
};
