const { getCollection } = require('../../config/collections.js');

Page({
  data: {
    pageLoading: false,
    openids: {
      Elie: 'oup1z5Dv4pTjk0iZKjg3BT63EH7g',
      Nora: 'oup1z5IWvTgiJitepm5-VMK9ysKw'
    },
    avatars: {
      'oup1z5Dv4pTjk0iZKjg3BT63EH7g': '/images/headphoto/Elie.jpeg',
      'oup1z5IWvTgiJitepm5-VMK9ysKw': '/images/headphoto/Nora.jpeg'
    },
    diaryList: [],
    currentDate: new Date().toISOString().split('T')[0],
    weather: ['☀️', '🌤', '☁️', '🌧', '🌩', '❄️'],
    selectedWeather: '☀️',
    moods: ['😊', '😄', '😢', '😡', '😴', '🤔']
  },

  onLoad() {
    this.loadDiaryList();
  },

  onShow() {
    // 每次显示页面时刷新列表
    this.loadDiaryList();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadDiaryList().then(() => {
      wx.stopPullDownRefresh();
    }).catch(err => {
      console.error('刷新失败：', err);
      wx.stopPullDownRefresh();
    });
  },

  // 加载日记列表
  loadDiaryList() {
    this.setData({ pageLoading: true });
    
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database();
      db.collection(getCollection('DIARY'))
        .orderBy('createTime', 'desc')
        .get()
        .then(res => {
          // 格式化日期并添加用户信息
          const formattedList = res.data.map(item => ({
            ...item,
            date: this.formatDate(new Date(item.createTime)),
            avatarUrl: this.data.avatars[item.openid] || '/images/default-avatar.png',
            userName: item.openid === this.data.openids.Elie ? 'Elie' : 
                     item.openid === this.data.openids.Nora ? 'Nora' : '未知用户'
          }));
          this.setData({
            diaryList: formattedList
          });
          resolve();
        })
        .catch(err => {
          console.error('加载日记失败：', err);
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
          reject(err);
        })
        .finally(() => {
          this.setData({ pageLoading: false });
        });
    });
  },

  // 格式化日期
  formatDate(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}月${day}日`;
  },

  // 选择天气
  selectWeather(e) {
    this.setData({
      selectedWeather: e.currentTarget.dataset.weather
    });
  },

  // 预览图片
  previewImage(e) {
    const { url, urls } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  // 添加新日记
  addDiary() {
    console.log('开始调用云函数...');
    this.setData({ pageLoading: true });
    
    wx.cloud.callFunction({
      name: 'getOpenId'
    }).then(res => {
      console.log('云函数调用成功：', res);
      if (!res.result || !res.result.success) {
        throw new Error(res.result?.error || '获取用户信息失败');
      }
      
      wx.hideLoading();
      const openid = res.result.openid;
      if (!openid) {
        throw new Error('未获取到有效的openid');
      }
      
      wx.navigateTo({
        url: `/pages/diary/add/index?weather=${this.data.selectedWeather}&openid=${openid}`
      });
    }).catch(err => {
      console.error('获取用户ID失败：', err);
      wx.showToast({
        title: err.message || '获取用户信息失败',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ pageLoading: false });
    });
  },

  // 显示操作菜单
  showActionSheet(e) {
    const diary = e.currentTarget.dataset.diary;
    wx.showActionSheet({
      itemList: ['修改', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.editDiary(diary);
        } else if (res.tapIndex === 1) {
          this.deleteDiary(diary);
        }
      }
    });
  },

  // 修改日记
  editDiary(diary) {
    wx.navigateTo({
      url: `/pages/diary/edit/index?id=${diary._id}&weather=${diary.weather}&openid=${diary.openid}&isEdit=true`
    });
  },

  // 删除日记
  deleteDiary(diary) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这篇日记吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ pageLoading: true });
          try {
            const db = wx.cloud.database();
            // 先删除数据库数据
            await db.collection(getCollection('DIARY')).doc(diary._id).remove();
            
            // 删除相关图片
            if (diary.images && diary.images.length > 0) {
              await wx.cloud.deleteFile({
                fileList: diary.images
              });
            }

            // 显示成功提示
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });

            // 最后才重新加载列表
            this.loadDiaryList();
          } catch (err) {
            console.error('删除日记失败：', err);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          } finally {
            this.setData({ pageLoading: false });
          }
        }
      }
    });
  },
}); 