function challenges(parent, args, ctx, info) {
  const { skip, first, orderBy } = parent.args1
  return ctx.db.query.challenges({ where: { id_in: parent.challengeIds }, skip, first, orderBy }, info)
}

module.exports = {
  challenges,
}
