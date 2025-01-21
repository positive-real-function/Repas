// pages/anniversary/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 'all',
    tabs: [
      { id: 'all', name: '全部' },
      { id: 'baby', name: '和小宝' },
      // 用户可以添加更多自定义标签
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
  },

  onAddTap() {
    // 处理添加纪念日的逻辑
  },

  showSettings() {
    // 处理显示设置选项的逻辑
  }
})