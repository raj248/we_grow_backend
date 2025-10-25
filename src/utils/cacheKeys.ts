// ~/utils/cacheKeys.ts
export const cacheKeys = {
  TopupOptionList: (active: any) => `purchaseOption:all:list${active}`,
  purchaseOptionInfo: (id: string) => `purchaseOption:${id}:info`,
  // courseByType: (type: string) => `course:type:${type}`,
  transactionInfo: (id: string) => `transaction:${id}:info`,
  wallet: (id: string) => `wallet:${id}:info`,

  orderList: () => "order:all:list",
  orderInfo: (id: string) => `order:${id}:info`,
  orderStats: (id: string) => `order:${id}:withStats`,

  planList: () => "plan:all:list",
  planInfo: (id: string) => `plan:${id}:info`,
  // planStats: (id: string) => `plan:${id}:withStats`,

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
