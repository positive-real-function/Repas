// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    console.log('wxContext:', wxContext)
    
    if (!wxContext.OPENID) {
      throw new Error('未能获取到OPENID')
    }
    
    return {
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    }
  } catch (error) {
    console.error('云函数执行错误：', error)
    throw error
  }
} 