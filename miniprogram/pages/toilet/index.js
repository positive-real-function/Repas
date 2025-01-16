// pages/toilet/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 'Nora',
    tabs: ['Nora', 'Eile'],
    toiletRecords: [],
    avatars: {
      Nora: '/images/headphoto/Nora.jpeg',
      Eile: '/images/headphoto/Elie.jpeg'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadToiletRecords();
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

  // 加载记录
  async loadToiletRecords() {
    wx.showLoading({ title: '加载中...' });
    
    try {
      const db = wx.cloud.database();
      
      const { data } = await db.collection('toilet_records')
        .where({
          user: this.data.currentTab
        })
        .orderBy('createTime', 'desc')
        .get();
      
      this.setData({
        toiletRecords: data
      });
    } catch (err) {
      console.error('加载记录失败：', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 切换tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
    this.loadToiletRecords();
  },

  // 添加记录
  addRecord() {
    const now = new Date();
    const db = wx.cloud.database();
    
    wx.showLoading({ title: '记录中...' });
    
    db.collection('toilet_records').add({
      data: {
        user: this.data.currentTab,
        createTime: now,
        avatar: this.data.avatars[this.data.currentTab]
      }
    }).then(() => {
      wx.showToast({
        title: '记录成功',
        icon: 'success'
      });
      this.loadToiletRecords();
    }).catch(err => {
      console.error('记录失败：', err);
      wx.showToast({
        title: '记录失败',
        icon: 'none'
      });
    }).finally(() => {
      wx.hideLoading();
    });
  }
})