// ~/utils/cacheKeys.ts
export const cacheKeys = {
  purchaseOptionList: () => 'purchaseOption:all:list',
  purchaseOptionInfo: (id: string) => `purchaseOption:${id}:info`,
  // courseByType: (type: string) => `course:type:${type}`,
  transactionInfo: (id: string) => `transaction:${id}:info`,
  // courseStats: (id: string) => `course:${id}:withStats`,

  topicByCourseType: (type: string) => `topic:courseType:${type}`,

  topicInfo: (id: string) => `topic:${id}:info`,
  topicStats: (id: string) => `topic:${id}:withStats`,
  testPaperByTopic: (id: string) => `testpaper:topic:${id}`,

  testPaperInfo: (id: string) => `testpaper:${id}:info`,
  testPaperStats: (id: string) => `testpaper:${id}:withStats`,
  testPaperAnswers: (id: string) => `testpaper:${id}:answers`,


  mcqByTestPaper: (id: string) => `mcq:testpaper:${id}`,
  noteByTopic: (id: string) => `note:topic:${id}`,
  videoNoteByTopic: (id: string) => `videonote:topic:${id}`,
};
