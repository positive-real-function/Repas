// pages/home/home.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    modules: [
      { id: 'diary', name: '日记', icon: '/images/icons/diary.png' },
      { id: 'anniversary', name: '纪念日', icon: '/images/icons/anniversary.png' },
      { id: 'message', name: '留言', icon: '/images/icons/message.png' },
      { id: 'sports', name: '运动', icon: '/images/icons/sports.png' },
      { id: 'list', name: 'list', icon: '/images/icons/list.png' },
      { id: 'toilet', name: '拉屎', icon: '/images/icons/toilet.png' }
    ],
    openids: {
      Elie: 'oup1z5Dv4pTjk0iZKjg3BT63EH7g',
      Nora: 'oup1z5IWvTgiJitepm5-VMK9ysKw'
    },
    userInfo: {
      openid: '',
      isElie: false,
      isNora: false
    },
    avatarLeft: '/images/headphoto/Nora.jpeg',
    avatarRight: '/images/headphoto/Elie.jpeg',
    currentDate: '',
    weekDay: '',
    togetherDays: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.getUserInfo();
    this.setCurrentDate();
    this.calculateTogetherDays();
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

  // 点击功能模块
  onModuleTap(e) {
    const moduleId = e.currentTarget.dataset.id;
    // // 检查权限
    // if (!this.data.userInfo.isElie && !this.data.userInfo.isNora) {
    //   wx.showToast({
    //     title: '无权访问',
    //     icon: 'none'
    //   });
    //   return;
    // }
    
    setTimeout(() => {
      wx.navigateTo({
        url: `/pages/${moduleId}/index`
      });
    }, 500);
  },

  // 点击在一起卡片
  onTogetherCardTap() {
    // 可以添加点击卡片的交互
    console.log('点击了在一起卡片');
  },

  // 点击头像
  onAvatarTap(e) {
    const { type } = e.currentTarget.dataset;
    console.log('点击了头像:', type);
  },

  // 设置当前日期和星期
  setCurrentDate() {
    const now = new Date();
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    this.setData({
      currentDate: `${month}月${day}日`,
      weekDay: weekDays[now.getDay()]
    });
  },

  // 计算在一起的天数
  calculateTogetherDays() {
    // 设置在一起的起始日期
    const startDate = new Date('2021-11-12'); // 你们在一起的日期
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    this.setData({
      togetherDays: diffDays
    });
  },

  // 获取用户信息
  async getUserInfo() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getOpenId'
      });
      
      const openid = result.openid;
      const isElie = openid === this.data.openids.Elie;
      const isNora = openid === this.data.openids.Nora;
      
      this.setData({
        'userInfo.openid': openid,
        'userInfo.isElie': isElie,
        'userInfo.isNora': isNora
      });
      
      console.log('当前用户:', isElie ? 'Elie' : (isNora ? 'Nora' : '其他用户'));
    } catch (err) {
      console.error('获取用户信息失败:', err);
    }
  }
})