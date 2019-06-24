var flat = require('array.prototype.flat');

const challengeMsg = {
    subscribe: (parent, args, ctx, info) => {
      return ctx.db.subscription.challengeMessage(
        { where:{
          AND: [
            {
              mutation_in: ["CREATED"]
            },
            {
            node: {
              challenge: {
                id: args.challengeId
                }
              }
            }
          ] }
        },
        info
      )
    }
  }



const newPanel = {
      subscribe: async (parent, args, ctx, info) => {
        return ctx.db.subscription
          .panel({ where:{
            AND: [
              {
                mutation_in: ["CREATED"]
              },
              {
              node: {
                test: {
                  id: args.testId
                  }
                }
              }
            ] }
          },
        `{ node { id link label questions { questionAnswers {  answer { correct } } } } }` )
      },
      resolve: (payload, args, context, info) => {
        const panel = payload.panel.node
        return {
          id:panel.id,
          question:panel.label ? panel.label : '',
          panelLink:panel.link,
          total: flat(panel.questions.map(q => q.questionAnswers.map(a => a.answer.correct))).length,
          totalCorrect: flat(panel.questions.map(q => q.questionAnswers.map(a => a.answer.correct))).filter(a => a).length,
          percentCorrect: flat(panel.questions.map(q => q.questionAnswers.map(a => a.answer.correct))).filter(a => a).length / flat(panel.questions.map(q => q.questionAnswers.map(a => a.answer.correct))).length > 0 ? flat(panel.questions.map(q => q.questionAnswers.map(a => a.answer.correct))).filter(a => a).length / flat(panel.questions.map(q => q.questionAnswers.map(a => a.answer.correct))).length : 0.0
        }
      },
    }


const panelCount = {
      subscribe: async (parent, args, ctx, info) => {
        return ctx.db.subscription
          .panel({ where: {
            AND: [
              {
                mutation_in: ["CREATED", "DELETED"]
              },
              {
              node: {
                test: {
                  id: args.testId
                  }
                }
              }
            ] }
          },
        `{ node { id } }` )
      },
      resolve: async (payload, args, ctx, info) => {

        const panelsConnection = await ctx.db.query.panelsConnection(
          {
            where: {
              test: {
                id: args.testId
              }
            }
          },
          `{ aggregate { count } }`
        )

        return {
          count: panelsConnection.aggregate.count
        }
      },
    }

const questionCount = {
      subscribe: async (parent, args, ctx, info) => {
        return ctx.db.subscription
          .question({ where:{
            AND: [
              {
                mutation_in: ["CREATED","DELETED"]
              },
              {
              node: {
                test: {
                  id: args.testId
                  }
                }
              }
            ] }
          },
        `{ node { id } }` )
      },
      resolve: async (payload, args, ctx, info) => {

        const questionsConnection = await ctx.db.query.questionsConnection(
          {
            where: {
              test: {
                id: args.testId
              }
            }
          },
          `{ aggregate { count } }`
        )

        return {
          count: questionsConnection.aggregate.count
        }
      },
    }

const challengeCount = {
      subscribe: async (parent, args, ctx, info) => {
        return ctx.db.subscription
          .challenge({ where:{
            AND: [
              {
                mutation_in: ["CREATED","DELETED"]
              },
              {
              node: {
                test: {
                  id: args.testId
                  }
                }
              }
            ] }
          },
        `{ node { id } }` )
      },
      resolve: async (payload, args, ctx, info) => {

        const challengesConnection = await ctx.db.query.challengesConnection(
          {
            where: {
              test: {
                id: args.testId
              }
            }
          },
          `{ aggregate { count } }`
        )

        return {
          count: challengesConnection.aggregate.count
        }
      },
    }


const newQuestion = {
    subscribe: (parent, args, ctx, info) => {
      return ctx.db.subscription.question(
        { where:{
          AND: [
            {
              mutation_in: ["CREATED","DELETED"]
            },
            {
            node: {
              test: {
                id: args.testId
                }
              }
            }
          ] }
        },
        info
      )
    }
  }

const newChallenge = {
    subscribe: (parent, args, ctx, info) => {
      return ctx.db.subscription.challenge(
        { where:{
          AND: [
            {
              mutation_in: ["CREATED","DELETED"]
            },
            {
              node: {
                answer:{
                  question:{
                    test:{
                      id:args.testId
                    }
                  }
                }
              }
            }
          ] }
        },
        info
      )
    }
  }

  const newAnswer = {
      subscribe: (parent, args, ctx, info) => {
        return ctx.db.subscription.answer(
          { where:{
            AND: [
              {
                mutation_in: ["CREATED","DELETED"]
              },
              {
                node: { question: { test: { id: args.testId } } }
              }
            ] }
          },
          info
        )
      }
    }



  const answerCount = {
    subscribe: async (parent, args, ctx, info) => {
      return ctx.db.subscription
        .answer({ where:{
          AND: [
            {
              mutation_in: ["CREATED","DELETED"]
            },
            {
              node: { question: { test: { id: args.testId } } }
            }
          ] }
        },
      `{ node { id } }` )
    },
    resolve: async (payload, args, ctx, info) => {

      const answersConnection = await ctx.db.query.answersConnection({ where: { answer:{ question: { test: { id: args.testId } } } } }, countSelectionSet)
      const answersCorrectConnection = await ctx.db.query.answersConnection({ where: { answer: { question:{ test:{ id: args.testId } } }, answerCorrect: true } }, countSelectionSet)

      const total = answersConnection.aggregate.count
      const totalCorrect = answersCorrectConnection.aggregate.count
      const percentCorrect = totalCorrect / total > 0 ? totalCorrect / total : 0.0

      return {
        total,
        totalCorrect,
        percentCorrect
      }
    },
  }



module.exports = {
  challengeMsg,
  newPanel,
  newQuestion,
  newChallenge,
  panelCount,
  questionCount,
  challengeCount,
  answerCount,
  newAnswer
}
