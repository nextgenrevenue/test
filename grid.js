// grid.js - FIXED CLICK ISSUE VERSION
console.log("📦 grid.js লোড হচ্ছে...");

class RealTimeGridSystem {
  constructor(config) {
    console.log("🔧 Grid System Constructor কল হয়েছে");
    
    const defaultConfig = {
      firebase: null,
      db: null,
      gridContainerId: 'serialGrid',
      selectedSerialInputId: 'serialInput',
      dayElementId: 'day',
      timeElementId: 'time',
      typeElementId: 'patientType',
      pendingSelectionsCollection: 'pendingSelections',
      appointmentsCollection: 'appointments',
      settingsCollection: 'settings',
      serialRangesDocId: 'serialRanges',
      onSerialClick: null,
      onGridUpdate: null,
      onPendingUpdate: null,
      mode: 'user',
      adminSessionId: null,
      userPendingExpiry: 1 * 60 * 1000,
      adminPendingExpiry: 5 * 60 * 1000,
      enableRealTime: true,
      customFilters: {}
    };
    
    this.config = { ...defaultConfig, ...config };
    
    this.serialRanges = {};
    this.appointments = [];
    this.pendingSelections = {};
    this.userPendingId = null;
    this.currentSelection = null;
    this.realtimeListeners = [];
    this.currentUserPendingSerial = null;
    this.isProcessingClick = false; // ✅ ক্লিক প্রসেসিং স্টেট
    this.lastClickedSerial = null; // ✅ শেষ ক্লিক করা সিরিয়াল
    
    console.log(`✅ Grid System তৈরি হয়েছে (${this.config.mode} মোড)`);
  }

  // ==================== CSS ইনজেকশন ====================
  injectStyles() {
    console.log("🎨 CSS স্টাইল ইনজেক্ট হচ্ছে...");
    
    if (document.getElementById('grid-system-styles')) {
      console.log("ℹ️ CSS ইতিমধ্যে ইনজেক্ট করা হয়েছে");
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'grid-system-styles';
    
    const css = `
      /* Grid System Styles - FIXED VERSION */
      .serial-grid {
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        gap: 8px;
        margin: 10px 0;
        padding: 10px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        max-height: 300px;
        overflow-y: auto;
        background-color: white;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }
      
      .serial-item {
        padding: 10px;
        border: 2px solid transparent;
        border-radius: 6px;
        text-align: center;
        font-weight: 500;
        font-size: 14px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* ✅ স্মুথ ট্রানজিশন */
        user-select: none;
        cursor: pointer;
        min-height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none !important;
        -webkit-tap-highlight-color: transparent !important;
        touch-action: manipulation;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        position: relative;
        overflow: hidden;
      }
      
      /* সিলেক্ট করার পর হোভার বন্ধ */
      .serial-item.selected {
        pointer-events: none;
      }
      
      /* ফোকাস স্টাইল সম্পূর্ণ রিমুভ */
      .serial-item:focus,
      .serial-item:active,
      .serial-item:focus-visible,
      .serial-item:focus-within {
        outline: none !important;
        box-shadow: none !important;
        border-color: inherit !important;
      }
      
      /* সবুজ - খালি */
      .serial-item.available {
        background-color: #dcfce7 !important; /* ✅ !important */
        color: #16a34a !important; /* ✅ !important */
        border: 2px solid #16a34a !important; /* ✅ !important */
      }
      
      .serial-item.available:hover {
        background-color: #bbf7d0 !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(34, 197, 94, 0.2);
      }
      
      /* লাল - বুকড */
      .serial-item.booked {
        background-color: #fecaca !important;
        color: #dc2626 !important;
        border: 2px solid #dc2626 !important;
        cursor: not-allowed;
        opacity: 0.8;
      }
      
      /* নীল - সিলেক্টেড (অন্য ইউজার) */
      .serial-item.pending {
        background-color: #dbeafe !important;
        color: #3b82f6 !important;
        border: 2px solid #3b82f6 !important;
        cursor: not-allowed;
        opacity: 0.7;
      }
      
      /* হলুদ - আপনার নির্বাচিত */
      .serial-item.selected {
        background-color: #fef3c7 !important;
        color: #f59e0b !important;
        border: 2px solid #f59e0b !important;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        font-weight: 700;
        animation: pulse 0.5s ease;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1.05); }
      }
      
      /* এক্সপায়ার্ড */
      .serial-item.expired {
        background-color: #f3f4f6 !important;
        color: #4b5563 !important;
        border-color: #9ca3af !important;
        cursor: pointer;
      }
      
      .serial-item.expired:hover {
        background-color: #e5e7eb;
      }
      
      /* লোডিং স্টেট */
      .serial-item.loading {
        cursor: wait !important;
        opacity: 0.8;
      }
      
      /* Responsive Design */
      @media (max-width: 768px) {
        .serial-grid {
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }
        
        .serial-item {
          padding: 8px;
          font-size: 13px;
          min-height: 36px;
        }
      }
      
      .grid-no-selection {
        grid-column: 1 / -1;
        text-align: center;
        padding: 20px;
        color: #6b7280;
      }
      
      .grid-loading {
        grid-column: 1 / -1;
        text-align: center;
        padding: 30px;
        color: #3b82f6;
      }
      
      /* Click ripple effect */
      .serial-item::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 5px;
        height: 5px;
        background: rgba(59, 130, 246, 0.5);
        opacity: 0;
        border-radius: 100%;
        transform: scale(1, 1) translate(-50%);
        transform-origin: 50% 50%;
      }
      
      .serial-item:focus:not(:active)::after {
        animation: ripple 1s ease-out;
      }
      
      @keyframes ripple {
        0% {
          transform: scale(0, 0);
          opacity: 0.5;
        }
        20% {
          transform: scale(25, 25);
          opacity: 0.3;
        }
        100% {
          opacity: 0;
          transform: scale(40, 40);
        }
      }
    `;
    
    style.textContent = css;
    document.head.appendChild(style);
    console.log("✅ CSS সফলভাবে ইনজেক্ট হয়েছে");
  }

  // ==================== ইনিশিয়ালাইজেশন ====================
  async init() {
    console.log("🚀 Grid System ইনিশিয়ালাইজেশন শুরু...");
    
    try {
      this.injectStyles();
      
      if (!this.config.db) {
        throw new Error('Firebase Firestore database is not available');
      }
      
      await this.loadSerialRanges();
      await this.loadAppointments();
      
      if (this.config.enableRealTime) {
        this.setupRealtimeListeners();
      }
      
      this.setupEventListeners();
      
      // ✅ সরাসরি ক্লিক ইভেন্ট সেটআপ
      this.setupDirectClickEvents();
      
      console.log("✅ Grid System সফলভাবে ইনিশিয়ালাইজ হয়েছে");
      return true;
      
    } catch (error) {
      console.error("❌ Grid System ইনিশিয়ালাইজেশন ব্যর্থ:", error);
      return false;
    }
  }

  // ==================== ডাটা লোডিং ====================
  async loadSerialRanges() {
    if (!this.config.db) return;
    
    try {
      console.log("📊 সিরিয়াল রেঞ্জ লোড হচ্ছে...");
      
      const doc = await this.config.db
        .collection(this.config.settingsCollection)
        .doc(this.config.serialRangesDocId)
        .get();
      
      if (doc.exists) {
        this.serialRanges = doc.data();
        console.log("✅ সিরিয়াল রেঞ্জ লোড হয়েছে");
      } else {
        this.serialRanges = {
          Thursday: { new: {}, old: {} },
          Friday: { new: {}, old: {} }
        };
      }
      
    } catch (error) {
      console.error("❌ সিরিয়াল রেঞ্জ লোড করতে সমস্যা:", error);
    }
  }

  async loadAppointments() {
    if (!this.config.db) return;
    
    try {
      console.log("📅 অ্যাপয়েন্টমেন্ট লোড হচ্ছে...");
      
      // ✅ সব ডাটা লোড (৪ দিনের ফিল্টার পরে হবে)
      const snapshot = await this.config.db
        .collection(this.config.appointmentsCollection)
        .get();
      
      this.appointments = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        this.appointments.push({
          id: doc.id,
          ...data,
          // ✅ ৪ দিনের চেক যোগ করুন
          isExpired: this.isAppointmentExpired(data)
        });
      });
      
      console.log(`✅ ${this.appointments.length} টি অ্যাপয়েন্টমেন্ট লোড হয়েছে`);
      
    } catch (error) {
      console.error("❌ অ্যাপয়েন্টমেন্ট লোড করতে সমস্যা:", error);
      this.appointments = [];
    }
  }

  // ==================== ৪ দিনের ফিল্টার ফাংশন ====================
  isAppointmentExpired(appointment) {
    if (!appointment.timestamp || !appointment.timestamp.toDate) return false;
    
    const appointmentDate = appointment.timestamp.toDate();
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    
    return appointmentDate < fourDaysAgo;
  }

  // ==================== সরাসরি ক্লিক ইভেন্ট সেটআপ ====================
  setupDirectClickEvents() {
    const gridContainer = document.getElementById(this.config.gridContainerId);
    if (!gridContainer) return;
    
    // ✅ ইভেন্ট ডেলিগেশন ব্যবহার করুন
    gridContainer.addEventListener('click', (e) => {
      const serialItem = e.target.closest('.serial-item');
      if (!serialItem) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // ✅ একই সময়ে একাধিক ক্লিক প্রিভেন্ট
      if (this.isProcessingClick) {
        console.log("⏳ অন্য ক্লিক প্রসেস হচ্ছে, অপেক্ষা করুন...");
        return;
      }
      
      this.handleSerialClick(serialItem);
    });
    
    // ✅ টাচ ইভেন্ট
    gridContainer.addEventListener('touchstart', (e) => {
      const serialItem = e.target.closest('.serial-item');
      if (!serialItem) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      if (this.isProcessingClick) return;
      
      this.handleSerialClick(serialItem);
    }, { passive: false });
    
    console.log("🎯 সরাসরি ক্লিক ইভেন্ট সেটআপ সম্পন্ন");
  }

  setupEventListeners() {
    console.log("🎯 ফর্ম ইভেন্ট লিসেনার সেটআপ হচ্ছে...");
    
    const elementsToWatch = [
      this.config.dayElementId,
      this.config.timeElementId,
      this.config.typeElementId
    ];
    
    elementsToWatch.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) {
        element.addEventListener('change', () => {
          console.log(`${elementId} চেঞ্জ হয়েছে, গ্রিড আপডেট হচ্ছে...`);
          this.updateGrid();
        });
      }
    });
  }

  // ==================== ইউটিলিটি ফাংশন ====================
  getElementValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value : null;
  }

  getSerialRange(day, type, time) {
    if (this.serialRanges[day] && 
        this.serialRanges[day][type] && 
        this.serialRanges[day][type][time]) {
      return this.serialRanges[day][type][time];
    }
    return null;
  }

  getSerialStatus(serial, day, time, type, pendingData) {
    const status = {
      isBooked: false,
      isExpiredBooking: false,
      isOtherUserPending: false,
      isCurrentUserPending: false,
      tooltip: `সিরিয়াল: ${serial}`
    };
    
    // ✅ প্রথমে চেক করুন সেটা বর্তমান ইউজারের সিলেক্টেড কিনা
    if (this.currentUserPendingSerial === serial) {
      status.isCurrentUserPending = true;
      status.tooltip = 'আপনার নির্বাচিত (পেন্ডিং)';
      return status;
    }
    
    // ✅ তারপর অ্যাপয়েন্টমেন্ট খুঁজুন
    const appointment = this.appointments.find(app => {
      const patientType = app.patientType || app.type;
      return app.day === day &&
             app.time === time &&
             patientType === type &&
             app.serial === serial;
    });
    
    if (appointment) {
      // ✅ ৪ দিনের বেশি পুরানো কিনা চেক
      if (this.isAppointmentExpired(appointment)) {
        status.isExpiredBooking = true;
        status.tooltip = 'এই সিরিয়ালটি ৪ দিনের বেশি পুরানো, আবার বুক করা যাবে';
      } else {
        status.isBooked = true;
        status.tooltip = 'ইতিমধ্যে বুক করা হয়েছে';
      }
      return status;
    }
    
    // ✅ পেন্ডিং সিলেকশন চেক (অন্য ইউজার)
    if (pendingData.user && pendingData.user.some(p => p.serial === serial)) {
      status.isOtherUserPending = true;
      status.tooltip = 'অন্য ইউজার সিলেক্ট করেছেন (পেন্ডিং)';
      return status;
    }
    
    // ✅ খালি সিরিয়াল
    status.tooltip = 'খালি সিরিয়াল - ক্লিক করে নির্বাচন করুন';
    return status;
  }

  // ==================== গ্রিড রেন্ডারিং ====================
  updateGrid() {
    console.log("🎯 গ্রিড আপডেট হচ্ছে...");
    
    const gridContainer = document.getElementById(this.config.gridContainerId);
    if (!gridContainer) {
      console.error(`❌ গ্রিড কনটেইনার পাওয়া যায়নি: ${this.config.gridContainerId}`);
      return;
    }
    
    const day = this.getElementValue(this.config.dayElementId);
    const time = this.getElementValue(this.config.timeElementId);
    const type = this.getElementValue(this.config.typeElementId);
    
    console.log("গ্রিড প্যারামিটার:", { day, time, type });
    
    if (!day || !time || !type) {
      gridContainer.innerHTML = '<div class="grid-no-selection">দিন, সময় এবং ধরন নির্বাচন করুন</div>';
      return;
    }
    
    const range = this.getSerialRange(day, type, time);
    if (!range) {
      gridContainer.innerHTML = '<div class="grid-no-selection">এই সময়ের জন্য সিরিয়াল উপলব্ধ নেই</div>';
      return;
    }
    
    const [start, end] = range;
    const key = `${day}_${time}_${type}`;
    const pendingData = this.pendingSelections[key] || { user: [], admin: [] };
    
    // ✅ আগের গ্রিড ক্লিয়ার
    gridContainer.innerHTML = '';
    
    // ✅ সিরিয়াল আইটেম তৈরি
    for (let serial = start; serial <= end; serial++) {
      const serialItem = this.createSerialItem(serial, day, time, type, pendingData);
      gridContainer.appendChild(serialItem);
    }
    
    console.log(`✅ গ্রিড আপডেট হয়েছে: ${end - start + 1} টি সিরিয়াল`);
    
    if (this.config.onGridUpdate) {
      this.config.onGridUpdate('grid', { day, time, type, start, end });
    }
  }

  createSerialItem(serial, day, time, type, pendingData) {
    const serialItem = document.createElement('div');
    serialItem.className = 'serial-item';
    serialItem.textContent = serial;
    serialItem.dataset.serial = serial;
    serialItem.dataset.day = day;
    serialItem.dataset.time = time;
    serialItem.dataset.type = type;
    
    // ✅ সরাসরি ক্লিক ইভেন্ট (বেকআপ হিসেবে)
    serialItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleSerialClick(serialItem);
    });
    
    // ✅ ফোকাস প্রিভেন্ট
    serialItem.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
    
    serialItem.addEventListener('focus', (e) => {
      e.preventDefault();
      serialItem.blur();
    });
    
    // ✅ স্ট্যাটাস সেট
    const status = this.getSerialStatus(serial, day, time, type, pendingData);
    
    serialItem.classList.remove('available', 'booked', 'pending', 'selected', 'expired');
    
    if (status.isBooked) {
      serialItem.classList.add('booked');
    } 
    else if (status.isExpiredBooking) {
      serialItem.classList.add('expired');
    }
    else if (status.isCurrentUserPending) {
      serialItem.classList.add('selected');
      serialItem.style.cursor = 'default';
    }
    else if (status.isOtherUserPending) {
      serialItem.classList.add('pending');
    }
    else {
      serialItem.classList.add('available');
    }
    
    serialItem.title = status.tooltip;
    
    return serialItem;
  }

  // ==================== সিরিয়াল ক্লিক হ্যান্ডলার ====================
  async handleSerialClick(serialItem) {
    if (this.isProcessingClick) {
      console.log("⏳ অন্য ক্লিক প্রসেস হচ্ছে, অপেক্ষা করুন...");
      return;
    }
    
    // ✅ চেক যদি বুকড বা পেন্ডিং হয়
    if (serialItem.classList.contains('booked') || 
        serialItem.classList.contains('pending')) {
      console.log("❌ বুকড বা পেন্ডিং সিরিয়ালে ক্লিক করা হয়েছে");
      return;
    }
    
    const serial = parseInt(serialItem.dataset.serial);
    const day = serialItem.dataset.day;
    const time = serialItem.dataset.time;
    const type = serialItem.dataset.type;
    
    if (isNaN(serial)) {
      console.log("❌ ইনভ্যালিড সিরিয়াল নাম্বার");
      return;
    }
    
    console.log(`🎯 সিরিয়াল ${serial} ক্লিক করা হয়েছে`);
    
    // ✅ একই সিরিয়াল আবার ক্লিক হলে স্কিপ
    if (this.lastClickedSerial === serial && serialItem.classList.contains('selected')) {
      console.log("✅ ইতিমধ্যে সিলেক্ট করা সিরিয়াল");
      return;
    }
    
    // ✅ ক্লিক প্রসেসিং স্টেট সেট
    this.isProcessingClick = true;
    this.lastClickedSerial = serial;
    
    try {
      // ✅ UI আপডেট
      serialItem.classList.remove('available', 'expired', 'selected');
      serialItem.classList.add('selected', 'loading');
      serialItem.style.cursor = 'wait';
      
      // ✅ আগের সব সিলেক্টেড আইটেম রিসেট করুন (শুধু একই গ্রিডের জন্য)
      const gridContainer = document.getElementById(this.config.gridContainerId);
      if (gridContainer) {
        const allItems = gridContainer.querySelectorAll('.serial-item');
        allItems.forEach(item => {
          if (parseInt(item.dataset.serial) !== serial && 
              item.classList.contains('selected') &&
              !item.classList.contains('booked') &&
              !item.classList.contains('pending')) {
            item.classList.remove('selected');
            item.classList.add('available');
            item.style.cursor = 'pointer';
          }
        });
      }
      
      // ✅ সিরিয়াল সিলেক্ট
      await this.selectSerial(serial, day, time, type);
      
    } catch (error) {
      console.error("❌ সিরিয়াল সিলেক্টে সমস্যা:", error);
      serialItem.classList.remove('loading');
      serialItem.classList.add('available');
      serialItem.style.cursor = 'pointer';
    } finally {
      // ✅ ক্লিক প্রসেসিং স্টেট রিসেট
      setTimeout(() => {
        this.isProcessingClick = false;
        serialItem.classList.remove('loading');
      }, 500);
    }
  }

  // ==================== সিরিয়াল সিলেকশন ====================
  async selectSerial(serial, day, time, type) {
    if (!day || !time || !type) {
      day = this.getElementValue(this.config.dayElementId);
      time = this.getElementValue(this.config.timeElementId);
      type = this.getElementValue(this.config.typeElementId);
    }
    
    if (!day || !time || !type) {
      console.error("❌ সিরিয়াল সিলেক্ট করা যাবে না: দিন/সময়/ধরন নির্বাচন করুন");
      return;
    }
    
    // রেঞ্জ ভ্যালিডেশন
    const range = this.getSerialRange(day, type, time);
    if (!range) {
      console.error("❌ সিরিয়াল রেঞ্জ নেই");
      return;
    }
    
    const [start, end] = range;
    if (serial < start || serial > end) {
      console.error(`❌ সিরিয়াল ${serial} রেঞ্জের বাইরে (${start}-${end})`);
      return;
    }
    
    // ✅ চেক করা বুকড কিনা (শুধু ৪ দিনের কম পুরানো)
    const appointment = this.appointments.find(app => {
      const patientType = app.patientType || app.type;
      return app.day === day &&
             app.time === time &&
             patientType === type &&
             app.serial === serial &&
             !this.isAppointmentExpired(app); // ✅ শুধু ৪ দিনের কম পুরানো
    });
    
    if (appointment) {
      console.log(`❌ সিরিয়াল ${serial} ইতিমধ্যে বুক করা হয়েছে`);
      
      if (this.config.onSerialClick) {
        this.config.onSerialClick({
          serial,
          day,
          time,
          type,
          status: 'booked',
          message: 'এই সিরিয়ালটি ইতিমধ্যে বুক করা হয়েছে'
        });
      }
      return;
    }
    
    // ✅ আগের পেন্ডিং সিলেকশন রিমুভ
    if (this.userPendingId) {
      await this.removePendingSelection(this.userPendingId);
    }
    
    // ✅ নতুন পেন্ডিং সিলেকশন অ্যাড
    this.userPendingId = await this.addPendingSelection(serial, day, time, type);
    
    if (this.userPendingId) {
      this.currentSelection = serial;
      this.currentUserPendingSerial = serial;
      
      // ✅ সিলেক্টেড ইনপুট আপডেট
      const selectedInput = document.getElementById(this.config.selectedSerialInputId);
      if (selectedInput) {
        selectedInput.value = serial;
        setTimeout(() => selectedInput.blur(), 10);
      }
      
      console.log(`✅ সিরিয়াল ${serial} সিলেক্ট হয়েছে, পেন্ডিং ID: ${this.userPendingId}`);
      
      // ✅ কলব্যাক কল
      if (this.config.onSerialClick) {
        this.config.onSerialClick({
          serial,
          day,
          time,
          type,
          status: 'pending',
          pendingId: this.userPendingId,
          message: 'সিরিয়াল সফলভাবে নির্বাচিত হয়েছে'
        });
      }
    }
  }

  async addPendingSelection(serial, day, time, type) {
    if (!this.config.db) {
      console.error("❌ ডাটাবেজ নেই");
      return null;
    }
    
    try {
      const pendingData = {
        serial: serial,
        day: day,
        time: time,
        type: type,
        bookedBy: this.config.mode,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + (
          this.config.mode === 'admin' ? 
          this.config.adminPendingExpiry : 
          this.config.userPendingExpiry
        ))
      };
      
      if (this.config.mode === 'admin') {
        pendingData.adminId = this.config.adminSessionId;
        pendingData.sessionId = this.config.adminSessionId;
      }
      
      const docRef = await this.config.db
        .collection(this.config.pendingSelectionsCollection)
        .add(pendingData);
      
      console.log(`📝 পেন্ডিং সিলেকশন অ্যাড করা হয়েছে: ${docRef.id}`);
      
      return docRef.id;
      
    } catch (error) {
      console.error("❌ পেন্ডিং সিলেকশন অ্যাড করতে সমস্যা:", error);
      return null;
    }
  }

  async removePendingSelection(pendingId) {
    if (!this.config.db || !pendingId) return;
    
    try {
      await this.config.db
        .collection(this.config.pendingSelectionsCollection)
        .doc(pendingId)
        .delete();
      
      this.userPendingId = null;
      this.currentUserPendingSerial = null;
      console.log(`✅ পেন্ডিং সিলেকশন রিমুভ হয়েছে: ${pendingId}`);
      
    } catch (error) {
      console.error("❌ পেন্ডিং সিলেকশন রিমুভ করতে সমস্যা:", error);
    }
  }

  // ==================== রিয়েল-টাইম লিসেনার ====================
  setupRealtimeListeners() {
    if (!this.config.db) return;
    
    console.log("🔗 রিয়েল-টাইম লিসেনার সেটআপ হচ্ছে...");
    
    // অ্যাপয়েন্টমেন্ট লিসেনার
    const appointmentsListener = this.config.db
      .collection(this.config.appointmentsCollection)
      .onSnapshot(snapshot => {
        console.log("🔄 অ্যাপয়েন্টমেন্ট আপডেট পাওয়া গেছে");
        
        this.appointments = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          this.appointments.push({
            id: doc.id,
            ...data,
            isExpired: this.isAppointmentExpired(data)
          });
        });
        
        this.updateGrid();
        
        if (this.config.onGridUpdate) {
          this.config.onGridUpdate('appointments', {
            count: this.appointments.length,
            data: this.appointments
          });
        }
      }, error => {
        console.error("❌ অ্যাপয়েন্টমেন্ট লিসেনার ত্রুটি:", error);
      });
    
    this.realtimeListeners.push(appointmentsListener);
    
    // পেন্ডিং সিলেকশন লিসেনার
    const pendingListener = this.config.db
      .collection(this.config.pendingSelectionsCollection)
      .where('expiresAt', '>', new Date())
      .onSnapshot(snapshot => {
        console.log("🔄 পেন্ডিং সিলেকশন আপডেট পাওয়া গেছে");
        
        this.processPendingSelections(snapshot);
        this.updateGrid();
        
        if (this.config.onPendingUpdate) {
          this.config.onPendingUpdate(this.pendingSelections);
        }
      }, error => {
        console.error("❌ পেন্ডিং সিলেকশন লিসেনার ত্রুটি:", error);
      });
    
    this.realtimeListeners.push(pendingListener);
  }

  processPendingSelections(snapshot) {
    this.pendingSelections = {};
    const now = new Date();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (data.expiresAt && data.expiresAt.toDate() > now) {
        const key = `${data.day}_${data.time}_${data.type}`;
        
        if (!this.pendingSelections[key]) {
          this.pendingSelections[key] = {
            user: [],
            admin: []
          };
        }
        
        if (data.bookedBy === 'user') {
          this.pendingSelections[key].user.push({
            serial: data.serial,
            id: doc.id,
            expiresAt: data.expiresAt
          });
          
          if (doc.id === this.userPendingId) {
            this.currentUserPendingSerial = data.serial;
          }
        } else if (data.bookedBy === 'admin') {
          this.pendingSelections[key].admin.push({
            serial: data.serial,
            id: doc.id,
            adminId: data.adminId,
            expiresAt: data.expiresAt
          });
        }
      }
    });
    
    console.log("📋 পেন্ডিং সিলেকশন প্রসেস করা হয়েছে");
  }

  // ==================== অতিরিক্ত মেথড ====================
  getAvailableSerials() {
    const day = this.getElementValue(this.config.dayElementId);
    const time = this.getElementValue(this.config.timeElementId);
    const type = this.getElementValue(this.config.typeElementId);
    const range = this.getSerialRange(day, type, time);
    
    if (!range) return [];
    
    const [start, end] = range;
    const available = [];
    
    for (let serial = start; serial <= end; serial++) {
      const key = `${day}_${time}_${type}`;
      const pendingData = this.pendingSelections[key] || { user: [], admin: [] };
      const status = this.getSerialStatus(serial, day, time, type, pendingData);
      
      if (!status.isBooked && !status.isOtherUserPending && !status.isAdminPending) {
        available.push(serial);
      }
    }
    
    return available;
  }

  forceUpdate() {
    this.updateGrid();
  }

  cleanup() {
    this.realtimeListeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    
    if (this.userPendingId) {
      this.removePendingSelection(this.userPendingId);
    }
    
    console.log("🧹 Grid System ক্লিনআপ সম্পন্ন");
  }
}

// গ্লোবাল এক্সপোর্ড
if (typeof window !== 'undefined') {
  window.RealTimeGridSystem = RealTimeGridSystem;
  console.log("✅ RealTimeGridSystem উইন্ডো অবজেক্টে রেজিস্টার হয়েছে");
}

console.log("📦 grid.js লোড সম্পন্ন");