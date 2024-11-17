function isAdmin(req, res, next) {
  if (req.session.user.role === 'admin') {
    return next(); 
  }
  return res.status(403).send('Доступ запрещен');
}

function isEditor(req, res, next) {
  if (req.session.user.role === 'editor') {
    return next(); 
  }
  return res.status(403).send('Доступ запрещен');
}

function canEditContent(req, res, next) {
  const contentCreator = req.params.creatorId; 
  if (req.session.user.role === 'admin' || req.session.user._id === contentCreator) {
    return next(); 
  }
  return res.status(403).send('Доступ запрещен');
}

module.exports = { isAdmin, isEditor, canEditContent };
