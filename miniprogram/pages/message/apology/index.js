// pages/message/apology/index.js
const db = wx.cloud.database()
const { getCollection } = require('../../../config/collections.js')

Page({
  data: {
    message: '',
    charCount: 0,
    userInfo: null
  },

  onLoad() {
    // 获取用户身份信息
    this.getUserProfile();
  },

  // 获取用户身份
  async getUserProfile() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getOpenId'
      });
      
      let userInfo;
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

      this.setData({ userInfo });
    } catch (err) {
      console.error('获取用户信息失败：', err);
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    }
  },

  onInput(e) {
    this.setData({
      message: e.detail.value,
      charCount: e.detail.value.length
    });
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

    if (content.length > 5200) {
      wx.showToast({
        title: '超出字数限制',
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
          type: 'apology'  // 设置类型为悄悄话
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
});