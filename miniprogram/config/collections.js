// 集合名称配置
const Collections = {
  PROD: {
    DIARY: 'diary',
    USER: 'user',
    MEAL: 'meal',
    REMIND: 'remind',
    MESSAGE: 'message',
    REPLY: 'reply',
    SPORTS: 'sports',
    TOILET: 'toilet',
    // 添加其他集合...
  },
  TEST: {
    DIARY: 'test_diary',
    USER: 'test_user',
    MEAL: 'test_meal',
    REMIND: 'test_remind',
    MESSAGE: 'test_message',
    REPLY: 'test_reply',
    SPORTS: 'test_sports',
    TOILET: 'test_toilet',
    // 添加其他测试集合...
  }
};

// 获取集合名称的工具函数
const getCollection = (collectionName) => {
  const app = getApp();
  const isAdminUser = app.globalData.isAdminUser;
  // 如果是管理员用户使用正式集合，否则使用测试集合
  return isAdminUser ? Collections.PROD[collectionName] : Collections.TEST[collectionName];
};

module.exports = {
  Collections,
  getCollection
}; 