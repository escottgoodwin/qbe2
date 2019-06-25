const { getUserId, getUser, getUserRole } = require('../utils')
const uuidv4 = require('uuid/v4');
var flat = require('array.prototype.flat');

async function users(parent, args, ctx, info) {

  const where = args.where

  const where1 = args.filter
      ? {
          OR: [
            { id: args.filter },
            { firstName_contains: args.filter },
            { lastName_contains: args.filter },
            { phone_contains: args.filter },
            { email_contains: args.filter }
          ],
        }
      : {}

    const queriedUsers = await ctx.db.query.users(
    { where },
    `{ id }`,
  )

    const countSelectionSet = `
      {
        aggregate {
          count
        }
      }
    `
    const usersConnection = await ctx.db.query.usersConnection( {where: where}, countSelectionSet)

    return {
      count: usersConnection.aggregate.count,
      userIds: queriedUsers.map(course => course.id),
      args1: args
    }

}

async function user(parent, args, ctx, info) {

    return await ctx.db.query.user( { where: { id: args.id } }, info)
}

async function institutions(parent, args, ctx, info) {

  const where = args.where

  const queriedInstitutions = await ctx.db.query.institutions(
  { where },
  `{ id }`,
)

  const countSelectionSet = `
    {
      aggregate {
        count
      }
    }
  `
  const institutionsConnection = await ctx.db.query.institutionsConnection( {where}, countSelectionSet)

  return {
    count: institutionsConnection.aggregate.count,
    institutionIds: queriedInstitutions.map(institution => institution.id),
    args1: args
  }

}

async function institution(parent, args, ctx, info) {

      return await ctx.db.query.institution( { where: { id: args.id } },info,)

}

async function courses(parent, args, ctx, info) {

    const where = args.where

    const queriedCourses = await ctx.db.query.courses(
    { where },
    `{ id }`,
  )

    const countSelectionSet = `
      {
        aggregate {
          count
        }
      }
    `
    const coursesConnection = await ctx.db.query.coursesConnection({ where }, countSelectionSet)

    return {
      count: coursesConnection.aggregate.count,
      courseIds: queriedCourses.map(course => course.id),
      args1: args
    }
}

async function course(parent, args, ctx, info) {

      return await ctx.db.query.course( { where: { id: args.id } },info )

}

async function courseDashboard(parent, args, ctx, info) {

    async function testList(testId){

      const queriedCourseTest= await ctx.db.query.test(
        { where: { id: testId } }, `{ id subject deleted published testType release releaseDate publishDate testDate testNumber panels { id } questions { id  questionAnswers { answerCorrect challenge { id } } } }`)

      const queriedCourseAnswers= await ctx.db.query.answers(
        { where: { question: {test:{ id:testId } } } }, `{ id answerCorrect }`)

      const { id, questions, subject, testDate, testNumber, testType, panels, release, releaseDate, published, publishDate, deleted } = queriedCourseTest

      const questionsCount= questions.length > 0 ? questions.length : 0
      const panelsCount= panels.length
      const answers = questions.length>0 ? questions.map(q => q.questionAnswers) : []
      const answersCount= queriedCourseAnswers.length>0 ? queriedCourseAnswers.length : 0
      const answersCorrect= queriedCourseAnswers.length>0 ? queriedCourseAnswers.filter(a => a.answerCorrect).length : 0
      const accuracy= answersCorrect / answersCount>0 ? answersCorrect / answersCount : 0.0

      const challengeCount = await ctx.db.query.challengesConnection({
        where: {
            answer:{
              question:{
                test:{
                  id:testId
                }
              }
            }
        }
      },
      `
        {
          aggregate {
            count
          }
        }
      `
    )

      return {
        id,
        deleted,
        subject,
        testDate,
        testNumber,
        testType,
        release,
        published,
        releaseDate,
        publishDate,
        questionsCount,
        panelsCount,
        answersCount,
        accuracy,
        challengeCount: challengeCount.aggregate.count
      }
  }

    const course = await ctx.db.query.course( { where: { id: args.courseId } },`{ id deleted name courseNumber time image students { id } tests { id } }`)
    const { id, deleted, name, courseNumber, time, image, students,  tests } = course
    const courseTestList = await Promise.all(course.tests.map(test => (testList(test.id))))

    return {
      id,
      deleted,
      name,
      time,
      image,
      courseNumber,
      studentCount: students.length,
      testCount: tests.length,
      courseTestList: courseTestList
  }

}

async function courseDashboard1(parent, args, ctx, info) {

    async function testList(queriedCourseTest){

      const { id, questions, subject, testDate, testNumber, testType, panels, release, releaseDate, published, publishDate, deleted } = queriedCourseTest

      const questionsCount= questions.length > 0 ? questions.length : 0
      const panelsCount= panels.length
      const answers = questions.length>0 ? flat(questions.map(q => q.questionAnswers)) : []
      const answersCount = answers.length>0 ? answers.length : 0
      const answersCorrect = answers.length>0 ? answers.filter(q => q.answerCorrect).length : 0
      const accuracy= answersCorrect / answersCount>0 ? answersCorrect / answersCount : 0.0

      return {
        id,
        deleted,
        subject,
        testDate,
        testNumber,
        testType,
        release,
        published,
        releaseDate,
        publishDate,
        questionsCount,
        panelsCount,
        answersCount,
        accuracy,
        challengeCount: 0
      }
  }

    const course = await ctx.db.query.course( { where: { id: args.courseId } },`{ id deleted name courseNumber time image students { id } tests { id subject deleted published testType release releaseDate publishDate testDate testNumber panels { id } questions { id  questionAnswers { id answerCorrect challenge { id } } } } }`)
    const { id, deleted, name, courseNumber, time, image, students, tests } = course
    const courseTestList = tests.map(test => testList(test))

    console.log(courseTestList)

    return {
      id,
      deleted,
      name,
      time,
      image,
      courseNumber,
      studentCount: students.length,
      testCount: tests.length,
      courseTestList: courseTestList
  }

}

async function testList(parent, args, ctx, info) {

      const queriedCourseTest= await ctx.db.query.test(
        { where: { id: args.testId } }, `{ id subject deleted published release releaseDate publishDate testDate testNumber panels { id } questions { id  questionAnswers { answerCorrect challenge { id } } } }`)

      const { id, subject, deleted, published, release, releaseDate, publishDate, testDate, testNumber, panels, questions } = queriedCourseTest

      const questionsCount= questions.length > 0 ? questions.length : 0
      const panelsCount= queriedCourseTest.panels.length
      const answers = questions.length>0 ? questions.map(q => q.questionAnswers) : []
      const answersCount= answers.length>0 ? answers.length : 0
      const answersCorrect= answers.length>0 ? answers.filter(a => a.answerCorrect).length : 0
      const accuracy= answersCorrect / answersCount>0 ? answersCorrect / answersCount : 0.0
      const challengeCount=  answers.filter(a => Boolean(a.challenge)).length > 0 ? answers.filter(a => Boolean(a.challenge)).length : 0

      return {
        id,
        deleted,
        subject,
        testDate,
        testNumber,
        release,
        published,
        releaseDate,
        publishDate,
        questionsCount,
        panelsCount,
        answersCount,
        accuracy,
        challengeCount
      }
}


async function testStats(parent, args, ctx, info) {

      const countSelectionSet = `
        {
          aggregate {
            count
          }
        }
      `

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
}

async function userAnsweredStats(parent, args, ctx, info){

    const userId = await getUserId(ctx)

    const countSelectionSet = `
      {
        aggregate {
          count
        }
      }
    `
    const answersConnection = await ctx.db.query.answersConnection({ where: { addedBy: { id: userId }, answer: { question: { test: { id: args.testId } } } } },
      countSelectionSet)

    const answersCorrectConnection = await ctx.db.query.answersConnection({ where: { addedBy: { id: userId }, answer: { question: { test: { id: args.testId } } }, answerCorrect: true } },
      countSelectionSet)

    const questionCorrectPercent = answersCorrectConnection.aggregate.count / answersConnection.aggregate.count

    function qpercent(qpercent){
      if (qpercent > 0){ return qpercent } else { return 0.0 }
    }

    const percentCorrect = qpercent(questionCorrectPercent)

    return {
      id: userId,
      name: '',
      total: answersConnection.aggregate.count,
      totalCorrect: answersCorrectConnection.aggregate.count,
      percentCorrect: percentCorrect,
    }
  }

  async function userQuestionStats(parent, args, ctx, info){

      const userId = await getUserId(ctx)

      const countSelectionSet = `
        {
          aggregate {
            count
          }
        }
      `


    const totalQuestions = await ctx.db.query.questionsConnection({ where: { addedBy: { id: userId }, test: { id: args.testId } } },
        countSelectionSet)

      //user's questions that have answers
      const answeredQuestions = await ctx.db.query.answersConnection({ where: { AND: [ { question: { addedBy: { id: userId } } }, { answer: { question: { test: { id: args.testId } } } } ] } },
        countSelectionSet)

      //user's questions that have answers that are correct
      const answeredQuestionsCorrect = await ctx.db.query.answersConnection({ where: { AND: [ { question: { addedBy: { id: userId } } }, { answer: { question: { test: { id: args.testId } } }, answerCorrect: true } ] } },
        countSelectionSet)

      // percent correct of user's questions that have answers
      const questionCorrectPercent = answeredQuestionsCorrect.aggregate.count / answeredQuestions.aggregate.count

      function qpercent(qpercent){
        if (qpercent > 0){ return qpercent } else { return 0.0 }
      }

       const percentCorrect = qpercent(questionCorrectPercent)

      return {
        totalQuestions: totalQuestions.aggregate.count,
        answers: answeredQuestions.aggregate.count,
        totalCorrect: answeredQuestionsCorrect.aggregate.count,
        percentCorrect: percentCorrect,
      }
    }


async function userTestStats(parent, args, ctx, info) {

  const countSelectionSet = `
    {
      aggregate {
        count
      }
    }
  `

  async function userStat(userId, testId, firstName, lastName){

      const answersConnection = await ctx.db.query.answersConnection({ where: { addedBy: { id: userId }, answer: { question: { test: { id: testId } } } } },
        countSelectionSet)

      const answersCorrectConnection = await ctx.db.query.answersConnection({ where: { addedBy: { id: userId }, answer: { question: { test: { id: testId } } }, answerCorrect: true } },
        countSelectionSet)

      const questionCorrectPercent = answersCorrectConnection.aggregate.count / answersConnection.aggregate.count

      function qpercent(qpercent){
        if (qpercent > 0){ return qpercent } else { return 0.0 }
      }

      const percentCorrect = qpercent(questionCorrectPercent)

      return {
        id: userId,
        name: firstName + ' ' + lastName,
        total: answersConnection.aggregate.count,
        totalCorrect: answersCorrectConnection.aggregate.count,
        percentCorrect: percentCorrect,
      }
    }

    const course = await ctx.db.query.course( { where: { id: args.courseId } },`{ students { id firstName lastName } }`)

    const statslist = course.students.map(student => (userStat(student.id,args.testId,student.firstName,student.lastName)))
    return statslist

}

async function testQuestionStats(parent, args, ctx, info) {

      const questionsAnswers = await ctx.db.query.questions({ where: { test: { id: args.testId } } }, `{ question panel { link } questionAnswers { answer { correct } } }` )

      const questionPercents = questionsAnswers.map(question =>
        ({
          question: question.question,
          total: question.questionAnswers.length,
          totalCorrect: question.questionAnswers.filter(answer => answer.answer.correct).length,
          percentCorrect: (question.questionAnswers.filter(answer => answer.answer.correct).length / question.questionAnswers.length) > 0 ? question.questionAnswers.filter(answer => answer.answer.correct).length / question.questionAnswers.length : 0.0,
          })
      )

      return questionPercents

}

async function testPanelStats(parent, args, ctx, info) {

      const panels = await ctx.db.query.panels({ where: { test: { id: args.testId } } }, `{ id link label questions { questionAnswers {  answer { correct } } } } ` )

      const testPanelStats = panels.map(panel => ({
        id:panel.id,
        question: panel.label !== null ? panel.label : '',
        panelLink:panel.link,
        total: flat(panel.questions.map(q => q.questionAnswers.map(a => a.answer.correct))).length,
        totalCorrect: flat(panel.questions.map(q => q.questionAnswers.map(a => a.answer.correct))).filter(a => a).length,
        percentCorrect: flat(panel.questions.map(q => q.questionAnswers.map(a => a.answer.correct))).filter(a => a).length / flat(panel.questions.map(q => q.questionAnswers.map(a => a.answer.correct))).length > 0 ? flat(panel.questions.map(q => q.questionAnswers.map(a => a.answer.correct))).filter(a => a).length / flat(panel.questions.map(q => q.questionAnswers.map(a => a.answer.correct))).length : 0.0
      })
    )
      return testPanelStats
}

async function tests(parent, args, ctx, info) {

  const where = args.where

  const queriedTests = await ctx.db.query.tests(
  { where },
  `{ id }`,
)

  const countSelectionSet = `
    {
      aggregate {
        count
      }
    }
  `
  const testsConnection = await ctx.db.query.testsConnection({ where }, countSelectionSet)

  return {
    count: testsConnection.aggregate.count,
    testIds: queriedTests.map(test => test.id),
    args1: args
  }
}

async function test(parent, args, ctx, info) {

  return await ctx.db.query.test( { where: { id: args.id } }, info)

}

async function panels(parent, args, ctx, info) {

  const where = args.where

  const queriedPanels = await ctx.db.query.panels(
  { where },
  `{ id }`,
)

  const countSelectionSet = `
    {
      aggregate {
        count
      }
    }
  `
  const panelsConnection = await ctx.db.query.panelsConnection({ where }, countSelectionSet)

  return {
    count: panelsConnection.aggregate.count,
    panelIds: queriedPanels.map(panel => panel.id),
    args1: args
  }
}

async function questionStats(parent, args, ctx, info) {

      const countSelectionSet = `
        {
          aggregate {
            count
          }
        }
      `

      const answersConnection = await ctx.db.query.answersConnection({ where: { question: { id: args.questionId } } }, countSelectionSet)
      const answersCorrectConnection = await ctx.db.query.answersConnection({ where: { question: { id: args.questionId }, answerCorrect: true } }, countSelectionSet)
      const questionCorrectPercent = answersCorrectConnection.aggregate.count / answersConnection.aggregate.count

      return {
        total: answersConnection.aggregate.count,
        totalCorrect: answersCorrectConnection.aggregate.count,
        percentCorrect: questionCorrectPercent,
      }
}

async function responseImages(parent, args, ctx, info) {

  const where = args.where

  const queriedResponseImages = await ctx.db.query.responseImages(
  { where },
  `{ id }`,
)

  const countSelectionSet = `
    {
      aggregate {
        count
      }
    }
  `

  const responseImages = await ctx.db.query.responseImagesConnection({ where }, countSelectionSet)

  return {
    count: responseImages.aggregate.count,
    responseImageIds: queriedResponseImages.map(question => question.id),
    args1: args
  }
}



async function questions(parent, args, ctx, info) {

  const where = args.where

  const queriedQuestions = await ctx.db.query.questions(
  { where },
  `{ id }`,
)

  const countSelectionSet = `
    {
      aggregate {
        count
      }
    }
  `

  const questionsConnection = await ctx.db.query.questionsConnection({ where }, countSelectionSet)

  return {
    count: questionsConnection.aggregate.count,
    questionIds: queriedQuestions.map(question => question.id),
    args1: args
  }
}

async function userQuestions(parent, args, ctx, info) {

    const userId = await getUserId(ctx)

    return await ctx.db.query.questions(
      {  where:
        {
          AND:[{
          test:{ id: args.testId }
        },
        {
        addedBy: { id: userId }
      }]
    }
  },
  info
  )
}

async function userQuestions1(parent, args, ctx, info) {

    const userId = await getUserId(ctx)

    const questions =  await ctx.db.query.questions(
      { where:
        {AND:[
          {addedBy:{id:userId}},
          {test:{id:args.testId}}
          ]
        }
      },
      `{ id question choices { id choice correct } questionAnswers { id answerCorrect answer { id choice correct } } }`
    )

  console.log('questions',questions)

  const countSelectionSet = `
    {
      aggregate {
        count
      }
    }
  `


const totalQuestions = await ctx.db.query.questionsConnection({ where: { addedBy: { id: userId }, test: { id: args.testId } } },
    countSelectionSet)

  //user's questions that have answers
  const answeredQuestions = await ctx.db.query.answersConnection({ where: { AND: [ { answer: { question: { addedBy: { id: userId } } } }, { answer: { question: { test: { id: args.testId } } } } ] } },
    countSelectionSet)

  //user's questions that have answers that are correct
  const answeredQuestionsCorrect = await ctx.db.query.answersConnection({ where: { AND: [ { answer: { question: { addedBy: { id: userId } } } }, { answer: { question: { test: { id: args.testId } } }, answerCorrect: true } ] } },
    countSelectionSet)

  // percent correct of user's questions that have answers
  const questionCorrectPercent = answeredQuestionsCorrect.aggregate.count / answeredQuestions.aggregate.count

  function qpercent(qpercent){
    if (qpercent > 0){ return qpercent } else { return 0.0 }
  }

   const percentCorrect = qpercent(questionCorrectPercent)

  return {
    questions,
    totalQuestions: totalQuestions.aggregate.count,
    answers: answeredQuestions.aggregate.count,
    totalCorrect: answeredQuestionsCorrect.aggregate.count,
    percentCorrect,
  }

}

async function userAnswers(parent, args, ctx, info) {

      const userId = await getUserId(ctx)

      return await ctx.db.query.answers(
      {  where:
        { AND: [{
            question:{
              test: { id: args.testId }
            }
            },
            { addedBy: { id: userId } }
          ]}
      },
      info
  )
}

async function userAnswers1(parent, args, ctx, info) {

      const userId = await getUserId(ctx)

      const answers = await ctx.db.query.answers(
      {  where:
        { AND: [{
            question:{
              test: { id: args.testId }
            }
            },
            { addedBy: { id: userId } }
          ]}
      },
      `{
        id
        answer{
          id
          choice
          correct
        }
        shortAnswerText
        answerCorrect
        question{
          id
          question
          questionType
          correctShortAnswer
          choices{
            id
            choice
            correct
          }
        }
        addedDate
        addedBy{
          id
          firstName
          lastName
        }
      }
      `
  )

  const countSelectionSet = `
    {
      aggregate {
        count
      }
    }
  `
  const answersConnection = await ctx.db.query.answersConnection({ where: { addedBy: { id: userId }, answer: { question: { test: { id: args.testId } } } } },
    countSelectionSet)

  const answersCorrectConnection = await ctx.db.query.answersConnection({ where: { addedBy: { id: userId }, answer: { question: { test: { id: args.testId } } }, answerCorrect: true } },
    countSelectionSet)

  const questionCorrectPercent = answersCorrectConnection.aggregate.count / answersConnection.aggregate.count

  function qpercent(qpercent){
    if (qpercent > 0){ return qpercent } else { return 0.0 }
  }

  const percentCorrect = qpercent(questionCorrectPercent)

  return {
    answers,
    total: answersConnection.aggregate.count,
    totalCorrect: answersCorrectConnection.aggregate.count,
    percentCorrect
  }

}

async function question(parent, args, ctx, info) {

      return await ctx.db.query.question( { where: { id: args.id } },info,)

}

async function questionsAnswered(parent, args, ctx, info) {
      const userId = await getUserId(ctx)
      const queriedAnswered = await ctx.db.query.answers(
      { where: {
        AND: [{question:{test:{id:args.testId}}},
              {addedBy:{id:userId}}]
            }},
          `{ id answerCorrect }`,
        )

        const answered = queriedAnswered.length > 0 ? queriedAnswered.length : 0
        const answeredCorrect = queriedAnswered.filter(question => question.answerCorrect === true).length > 0 ? queriedAnswered.filter(question => question.answerCorrect === true).length : 0
        const answeredPercent = answeredCorrect / answered > 0 ? answeredCorrect / answered : 0.0

        const queriedQuestions = await ctx.db.query.questions(
        { where: {
          AND:[{test:{id:args.testId}},
            {addedBy:{id:userId}}] }},
            `{ question }`,
          )

          const queriedAskedAnswers = await ctx.db.query.answers(
          { where:{
            AND:[{question:{test:{id:args.testId}}},
                {question:{addedBy:{id:userId}}}
                ] }},
          `{ id answerCorrect }`,
            )

          const asked = queriedQuestions.length > 0 ? queriedQuestions.length : 0

          const askedAnswered = queriedAskedAnswers.length > 0 ? queriedAskedAnswers.length : 0
          const askedAnsweredCorrect = queriedAskedAnswers.filter(question => question.answerCorrect === true).length > 0 ? queriedAskedAnswers.filter(question => question.answerCorrect === true).length : 0
          const askedAnsweredPercent = askedAnsweredCorrect / askedAnswered > 0 ? askedAnsweredCorrect / askedAnswered : 0.0


      return {
        answered: answered,
        answeredCorrect: answeredCorrect,
        answeredPercent: answeredPercent,
        asked: asked,
        askedAnswered: askedAnswered,
        askedAnsweredCorrect: askedAnsweredCorrect,
        askedAnsweredPercent: askedAnsweredPercent
      }
    }

async function questionchoices(parent, args, ctx, info) {

  const where = args.where

  const queriedQuestionChoices = await ctx.db.query.questionChoices(
  { where },
  `{ id }`,
)

  const countSelectionSet = `
    {
      aggregate {
        count
      }
    }
  `
  const questionChoicesConnection = await ctx.db.query.questionChoicesConnection({ where }, countSelectionSet)

  return {
    count: questionChoicesConnection.aggregate.count,
    questionChoiceIds: queriedQuestionChoices.map(questionChoice => questionChoice.id),
    args1: args
  }
}

async function challenges(parent, args, ctx, info) {

  const where = args.where

  const queriedChallenges = await ctx.db.query.challenges(
  { where },
  `{ id }`,
)

  const countSelectionSet = `
    {
      aggregate {
        count
      }
    }
  `
  const challengesConnection = await ctx.db.query.challengesConnection({ where }, countSelectionSet)

  return {
    count: challengesConnection.aggregate.count,
    challengeIds: queriedChallenges.map(challenge => challenge.id),
    args1: args
  }
}

async function challenge(parent, args, ctx, info) {

      return await ctx.db.query.challenge( { where: { id: args.id } },info,)

}

async function challengeMessages(parent, args, ctx, info) {

  const where = args.where

  const queriedChallengeMessages = await ctx.db.query.challengeMessages(
  { where },
  `{ id }`,
)

  const countSelectionSet = `
    {
      aggregate {
        count
      }
    }
  `

  const challengeMessagesConnection = await ctx.db.query.challengeMessagesConnection({ where }, countSelectionSet)

  return {
    count: challengeMessagesConnection.aggregate.count,
    challengeMessageIds: queriedChallengeMessages.map(challengeMessage => challengeMessage.id),
    args1: args
  }
}

async function answers(parent, args, ctx, info) {

  const where = args.where

  const queriedAnswers = await ctx.db.query.answers(
  { where },
  `{ id }`,
)

  const countSelectionSet = `
    {
      aggregate {
        count
      }
    }
  `
  const answersConnection = await ctx.db.query.answersConnection({ where }, countSelectionSet)

  return {
    count: answersConnection.aggregate.count,
    answerIds: queriedAnswers.map(answer => answer.id),
    args1: args
  }
}

async function answer(parent, args, ctx, info) {

      return await ctx.db.query.answer( { where: { id: args.id } },info,)

}

async function sequences(parent, args, ctx, info) {

  const where = args.where

  return await ctx.db.query.sequences({ where }, info)
}


module.exports = {
  users,
  user,
  institutions,
  institution,
  courses,
  course,
  courseDashboard,
  courseDashboard1,
  testList,
  tests,
  test,
  testStats,
  userAnsweredStats,
  userQuestionStats,
  userTestStats,
  testQuestionStats,
  testPanelStats,
  panels,
  responseImages,
  questions,
  question,
  userQuestions,
  userQuestions1,
  userAnswers,
  userAnswers1,
  questionsAnswered,
  questionStats,
  questionchoices,
  challenges,
  challenge,
  challengeMessages,
  answers,
  answer,
  sequences
}
