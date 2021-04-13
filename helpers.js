exports.replace = function (link){
  return link.replace(/[^a-z0-9\-]/gi, '_');
}
