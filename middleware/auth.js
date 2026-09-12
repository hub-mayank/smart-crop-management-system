function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: "error", message: "Please login to continue." };
    return res.redirect("/login");
  }
  next();
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  next();
}

module.exports = { requireLogin, redirectIfLoggedIn };
