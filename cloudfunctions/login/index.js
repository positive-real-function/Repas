const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    console.log('wxContext:', wxContext);
    
    if (!wxContext.OPENID) {
      throw new Error('未能获取到OPENID');
    }
    
    return {
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  } catch (error) {
    console.error('云函数执行错误：', error);
    throw error;
  }
}; 