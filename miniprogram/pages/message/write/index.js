// pages/message/write/index.js
const db = wx.cloud.database()
const { getCollection } = require('../../../config/collections.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    message: '',
    charCount: 0,
    userInfo: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取用户身份信息
    this.getUserProfile();
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

  onInput(e) {
    this.setData({
      message: e.detail.value,
      charCount: e.detail.value.length
    });
  },

  // 获取用户身份
  async getUserProfile() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getOpenId'
      });
      
      let userInfo; // 声明变量
      
      // 如果是Elie的openid，则使用Elie的信息
      if (result.openid === 'oup1z5Dv4pTjk0iZKjg3BT63EH7g') {
        userInfo = {
          openId: result.openid,
          avatar: '/images/headphoto/Elie.jpeg',
          userName: 'Elie'
        };
      } else {
        userInfo = {
          openId: result.openid,
          avatar: '/images/headphoto/Nora.jpeg',
          userName: 'Nora'
        };
      }

      console.log('获取到的用户信息：', userInfo); // 添加日志
      this.setData({ userInfo });
    } catch (err) {
      console.error('获取用户信息失败：', err);
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    }
  },

  async publishMessage() {
    const content = this.data.message.trim();
    if (!content) {
      wx.showToast({
        title: '留言不能为空',
        icon: 'none'
      });
      return;
    }

    if (!this.data.userInfo) {
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '发布中' });
    try {
      // 添加留言
      await db.collection(getCollection('MESSAGE')).add({
        data: {
          content,
          userId: this.data.userInfo.openId,
          userName: this.data.userInfo.userName,
          avatar: this.data.userInfo.avatar,
          createTime: db.serverDate(),
          type: 'mine'  // 或根据实际情况设置
        }
      });

      wx.showToast({
        title: '发布成功',
        icon: 'success'
      });
      
      // 返回上一页并刷新
      const pages = getCurrentPages();
      const messagePage = pages[pages.length - 2];
      if (messagePage) {
        messagePage.setData({
          page: 1,
          reachBottom: false
        }, () => {
          messagePage.getMessageList();
        });
      }
      
      wx.navigateBack();
    } catch (err) {
      console.error('发布失败：', err);
      wx.showToast({
        title: '发布失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  goBack() {
    wx.navigateBack();
  }
})