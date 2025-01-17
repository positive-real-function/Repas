// app.js
App({
  globalData: {
    allowedOpenIds: ['oup1z5Dv4pTjk0iZKjg3BT63EH7g', 'oup1z5IWvTgiJitepm5-VMK9ysKw'],
    userInfo: null,
    openid: null,
  },

  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: 'repas-0gr1x5by6fb1c499',
        traceUser: true,
      });
    }

    wx.cloud.callFunction({
      name: 'getOpenId',
      success: res => {
        console.log('云函数调用成功：', res)
        this.globalData.openid = res.result.openid
        console.log('当前用户openid：', res.result.openid)
        if (!this.globalData.allowedOpenIds.includes(res.result.openid)) {
          wx.showModal({
            title: '无权访问',
            content: '抱歉，您没有权限访问该小程序',
            showCancel: false,
            success: () => {
              wx.exitMiniProgram()
            }
          })
        }
      },
      fail: err => {
        console.error('获取openid失败，错误详情：', err)
        wx.showModal({
          title: '错误',
          content: '身份验证失败，请退出重试',
          showCancel: false,
          success: () => {
            wx.exitMiniProgram()
          }
        })
      }
    })
  },
});
