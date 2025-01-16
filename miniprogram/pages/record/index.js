// pages/record/index.js
Page({
  data: {
    currentTab: 'Nora',
    tabs: ['Nora', 'Eile'],
    mealRecords: [],
    currentDate: new Date().getTime(),
    timezones: {
      Nora: 8,
      Eile: 1
    },
    avatars: {
      Nora: '/images/headphoto/Nora.jpeg',
      Eile: '/images/headphoto/Elie.jpeg'
    }
  },

  onLoad() {
    this.loadMealRecords();
    this.setCurrentTime();
    setInterval(() => {
      this.setCurrentTime();
    }, 60000);
  },

  onShow() {
    this.loadMealRecords();
  },

  // 加载餐点记录
  async loadMealRecords() {
    wx.showLoading({ title: '加载中...' });
    try {
      if (!wx.cloud) {
        throw new Error('云开发未初始化');
      }
      
      const db = wx.cloud.database();
      const _ = db.command;
      
      const { data } = await db.collection('meal_records')
        .where({
          user: this.data.currentTab
        })
        .orderBy('createTime', 'desc')
        .get();
      
      if (!data || data.length === 0) {
        this.setData({
          mealRecords: []
        });
        return;
      }
      
      const groupedData = this.groupRecordsByDate(data);
      
      this.setData({
        mealRecords: groupedData
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

  // 按日期分组记录
  groupRecordsByDate(records) {
    const groups = {};
    
    records.forEach(record => {
      const date = new Date(record.createTime);
      const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      
      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          meals: []
        };
      }
      
      groups[dateStr].meals.push(record);
    });
    
    return Object.values(groups).sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    }, () => {
      this.loadMealRecords();
    });
  },

  // 设置当前时间
  setCurrentTime() {
    const now = new Date();
    const timezone = this.data.timezones[this.data.currentTab];
    const localTime = new Date(now.getTime() + (timezone * 60 * 60 * 1000));
    
    const hours = localTime.getUTCHours().toString().padStart(2, '0');
    const minutes = localTime.getUTCMinutes().toString().padStart(2, '0');
    
    this.setData({
      currentTime: `${hours}:${minutes}`
    });
  },

  // 添加新记录
  addNewRecord() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadImage(tempFilePath);
      }
    });
  },

  // 上传图片
  async uploadImage(tempFilePath) {
    wx.showLoading({ title: '上传中...' });
    try {
      const result = await wx.cloud.uploadFile({
        cloudPath: `meal_photos/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`,
        filePath: tempFilePath
      });
      
      wx.navigateTo({
        url: `/pages/record/edit/index?imagePath=${result.fileID}&user=${this.data.currentTab}&avatar=${this.data.avatars[this.data.currentTab]}`
      });
    } catch (err) {
      console.error('上传失败：', err);
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 预览图片
  previewImage(e) {
    const { image } = e.currentTarget.dataset;
    wx.previewImage({
      urls: [image],
      current: image
    });
  }
});