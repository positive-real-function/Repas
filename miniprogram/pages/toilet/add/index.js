// pages/toilet/add/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isStarted: false,
    startTime: null,
    timerText: '00:00:00',
    title: '粑粑简史',
    openid: '',
    user: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    try {
      // 获取当前用户的openid
      const { result: { openid } } = await wx.cloud.callFunction({
        name: 'getOpenId'
      });

      // openid到用户名的映射
      const openidToUser = {
        'oup1z5IWvTgiJitepm5-VMK9ysKw': 'Nora',
        'oup1z5Dv4pTjk0iZKjg3BT63EH7g': 'Elie'
      };

      const currentUser = openidToUser[openid];
      
      if (currentUser) {
        this.setData({
          user: currentUser,
          openid: openid
        });

        console.log('设置用户数据:', {
          user: currentUser,
          openid: openid
        });
      } else {
        wx.showToast({
          title: '未授权的用户',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      }
    } catch (error) {
      console.error('获取openid失败:', error);
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 开始计时
  startToilet() {
    this.setData({
      isStarted: true,
      startTime: new Date()
    });
    this.startTimer();
  },

  // 计时器
  startTimer() {
    this.timer = setInterval(() => {
      const now = new Date();
      const diff = now - this.data.startTime;
      
      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      
      this.setData({
        timerText: `${hours}:${minutes}:${seconds}`
      });
    }, 1000);
  },

  // 结束并记录
  finishToilet(e) {
    const result = e.currentTarget.dataset.result;
    clearInterval(this.timer);
    
    const duration = new Date() - this.data.startTime;
    
    if (result === 'success') {
      console.log('传递到详情页的数据:', {
        duration,
        startTime: this.data.startTime,
        openid: this.data.openid,
        user: this.data.user
      });

      wx.navigateTo({
        url: '/pages/toilet/detail/index',
        success: (res) => {
          res.eventChannel.emit('toiletData', {
            duration,
            startTime: this.data.startTime,
            openid: this.data.openid,
            user: this.data.user
          });
        }
      });
    } else {
      // 记录失败的情况
      wx.showToast({
        title: '加油，下次一定行！',
        icon: 'none',
        duration: 2000,
        complete: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        }
      });
    }
  }
})