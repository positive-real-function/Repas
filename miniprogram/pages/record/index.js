// pages/record/index.js
Page({
  data: {
    currentTab: 'Nora', // 当前选中的tab
    tabs: ['Nora', 'Eile'],
    mealRecords: [], // 餐点记录列表
    currentDate: new Date().getTime(),
    timezones: {
      Nora: 8, // 北京时间 UTC+8
      Eile: 1  // 巴黎时间 UTC+1
    },
    avatars: {
      Nora: '/images/headphoto/Nora.jpeg',
      Eile: '/images/headphoto/Elie.jpeg'
    }
  },

  onLoad() {
    this.loadMealRecords();
    this.setCurrentTime();
    // 每分钟更新一次时间
    setInterval(() => {
      this.setCurrentTime();
    }, 60000);
  },

  onUnload() {
    // 清除定时器
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  },

  // 加载餐点记录
  async loadMealRecords() {
    wx.showLoading({ title: '加载中...' });
    
    try {
      // 先检查云环境是否正确初始化
      if (!wx.cloud) {
        throw new Error('云开发未初始化');
      }
      
      const db = wx.cloud.database();
      const _ = db.command;
      
      console.log('开始获取记录...');
      
      // 获取当前用户的所有记录
      const { data } = await db.collection('meal_records')
        .where({
          user: this.data.currentTab
        })
        .orderBy('createTime', 'desc')
        .get();
      
      console.log('获取到的数据：', data);
      
      if (!data || data.length === 0) {
        console.log('没有找到记录');
        this.setData({
          mealRecords: []
        });
        return;
      }
      
      // 按日期分组处理数据
      const groupedData = this.groupRecordsByDate(data);
      
      this.setData({
        mealRecords: groupedData
      });
    } catch (err) {
      console.error('加载记录失败：', err);
      // 显示详细错误信息
      wx.showToast({
        title: '加载失败，请查看控制台',
        icon: 'none',
        duration: 3000
      });
      console.error('具体错误：', {
        message: err.message,
        errCode: err.errCode,
        errMsg: err.errMsg,
        stack: err.stack
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 将记录按日期分组
  groupRecordsByDate(records) {
    const groups = {};
    
    records.forEach(record => {
      // 处理日期，确保是有效的Date对象
      const date = record.createTime instanceof Date ? 
        record.createTime : 
        new Date(record.createTime);
        
      const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}`;
      
      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          meals: []
        };
      }
      
      groups[dateStr].meals.push({
        type: record.type,
        name: record.name,
        price: record.price,
        image: record.image,
        avatar: record.avatar
      });
    });
    
    return Object.values(groups);
  },

  // 切换tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
    this.loadMealRecords();
    this.setCurrentTime();
  },

  // 设置当前时间（考虑时区）
  setCurrentTime() {
    const now = new Date();
    const utcTime = now.getTime();
    const offset = this.data.timezones[this.data.currentTab];
    
    // 计算目标时区的时间
    const targetTime = new Date(utcTime + offset * 3600 * 1000);
    
    // 格式化时间
    const hours = String(targetTime.getUTCHours()).padStart(2, '0');
    const minutes = String(targetTime.getUTCMinutes()).padStart(2, '0');
    
    this.setData({
      currentTime: `${hours}:${minutes}`
    });
  },

  // 添加新记录
  addNewRecord() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const currentAvatar = this.data.avatars[this.data.currentTab];
        // 先上传图片到云存储
        this.uploadImage(res.tempFilePaths[0]).then(fileID => {
          wx.navigateTo({
            url: `/pages/record/edit/index?imagePath=${fileID}&user=${this.data.currentTab}&avatar=${currentAvatar}`
          });
        }).catch(err => {
          console.error('上传图片失败：', err);
          wx.showToast({
            title: '上传图片失败',
            icon: 'none'
          });
        });
      }
    });
  },

  // 上传图片到云存储
  uploadImage(tempFilePath) {
    return new Promise((resolve, reject) => {
      const cloudPath = `meal_images/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`;
      
      wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath,
        success: res => resolve(res.fileID),
        fail: err => reject(err)
      });
    });
  },

  // 预览图片
  previewImage(e) {
    const { image, dateIndex, index } = e.currentTarget.dataset;
    
    // 获取当前日期组的所有图片
    const currentDateImages = this.data.mealRecords[dateIndex].meals.map(meal => meal.image);
    
    wx.previewImage({
      current: image, // 当前显示图片的链接
      urls: currentDateImages, // 需要预览的图片链接列表
      showmenu: true, // 显示预览菜单
      success: () => {
        console.log('预览成功');
      },
      fail: (err) => {
        console.error('预览失败：', err);
      }
    });
  },

  // 显示操作菜单
  showActionSheet(e) {
    const record = e.currentTarget.dataset.record;
    const date = e.currentTarget.dataset.date;
    
    // 确保记录包含必要的信息
    const recordData = {
      _id: record._id,
      type: record.type,
      name: record.name,
      price: record.price,
      image: record.image,
      user: this.data.currentTab,
      avatar: this.data.avatars[this.data.currentTab],
      date: date
    };

    wx.showActionSheet({
      itemList: ['修改', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.editRecord(recordData);
        } else if (res.tapIndex === 1) {
          this.deleteRecord(recordData);
        }
      }
    });
  },

  // 修改记录
  editRecord(record) {
    wx.navigateTo({
      url: `/pages/record/edit/index?id=${record._id}&isEdit=true&imagePath=${record.image}&user=${record.user}&avatar=${record.avatar}`
    });
  },

  // 删除记录
  deleteRecord(record) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...'
          });

          try {
            const db = wx.cloud.database();
            await db.collection('meal_records').doc(record._id).remove();
            
            // 如果有图片，也删除云存储中的图片
            if (record.image) {
              await wx.cloud.deleteFile({
                fileList: [record.image]
              });
            }

            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });

            this.loadMealRecords(); // 重新加载列表
          } catch (err) {
            console.error('删除记录失败：', err);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  }
});