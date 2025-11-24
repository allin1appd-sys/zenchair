export const translations = {
  en: {
    common: {
      welcome: "Welcome",
      login: "Login",
      logout: "Logout",
      register: "Register",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      next: "Next",
      confirm: "Confirm",
      search: "Search",
      loading: "Loading...",
      error: "Error",
      success: "Success"
    },
    auth: {
      username: "Username",
      email: "Email",
      password: "Password",
      name: "Full Name",
      phone: "Phone Number",
      loginWithGoogle: "Login with Google",
      loginWithUsername: "Login with Username",
      createAccount: "Create Account",
      alreadyHaveAccount: "Already have an account?",
      dontHaveAccount: "Don't have an account?"
    },
    home: {
      findBarbers: "Find Barbers",
      searchByCity: "Search by City",
      mapView: "Map View",
      listView: "List View",
      nearbyBarbers: "Nearby Barbers",
      topRated: "Top Rated"
    },
    barber: {
      services: "Services",
      products: "Products",
      reviews: "Reviews",
      gallery: "Gallery",
      about: "About",
      bookNow: "Book Now",
      rating: "Rating",
      open: "Open",
      closed: "Closed"
    },
    booking: {
      selectService: "Select Service",
      selectDate: "Select Date",
      selectTime: "Select Time",
      addProducts: "Add Products",
      totalPrice: "Total Price",
      bookingNotes: "Booking Notes",
      confirmBooking: "Confirm Booking",
      myBookings: "My Bookings",
      upcomingBookings: "Upcoming Bookings",
      pastBookings: "Past Bookings"
    }
  },
  ar: {
    common: {
      welcome: "مرحباً",
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      register: "إنشاء حساب",
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      edit: "تعديل",
      back: "رجوع",
      next: "التالي",
      confirm: "تأكيد",
      search: "بحث",
      loading: "جاري التحميل...",
      error: "خطأ",
      success: "نجح"
    },
    auth: {
      username: "اسم المستخدم",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      name: "الاسم الكامل",
      phone: "رقم الهاتف",
      loginWithGoogle: "تسجيل الدخول بواسطة جوجل",
      loginWithUsername: "تسجيل الدخول باسم المستخدم",
      createAccount: "إنشاء حساب جديد",
      alreadyHaveAccount: "هل لديك حساب بالفعل؟",
      dontHaveAccount: "ليس لديك حساب؟"
    },
    home: {
      findBarbers: "ابحث عن حلاق",
      searchByCity: "البحث حسب المدينة",
      mapView: "عرض الخريطة",
      listView: "عرض القائمة",
      nearbyBarbers: "حلاقون قريبون",
      topRated: "الأعلى تقييماً"
    },
    barber: {
      services: "الخدمات",
      products: "المنتجات",
      reviews: "التقييمات",
      gallery: "المعرض",
      about: "حول",
      bookNow: "احجز الآن",
      rating: "التقييم",
      open: "مفتوح",
      closed: "مغلق"
    },
    booking: {
      selectService: "اختر الخدمة",
      selectDate: "اختر التاريخ",
      selectTime: "اختر الوقت",
      addProducts: "أضف منتجات",
      totalPrice: "السعر الإجمالي",
      bookingNotes: "ملاحظات الحجز",
      confirmBooking: "تأكيد الحجز",
      myBookings: "حجوزاتي",
      upcomingBookings: "الحجوزات القادمة",
      pastBookings: "الحجوزات السابقة"
    }
  },
  he: {
    common: {
      welcome: "ברוך הבא",
      login: "התחבר",
      logout: "התנתק",
      register: "הירשם",
      save: "שמור",
      cancel: "בטל",
      delete: "מחק",
      edit: "ערוך",
      back: "חזור",
      next: "הבא",
      confirm: "אשר",
      search: "חפש",
      loading: "טוען...",
      error: "שגיאה",
      success: "הצלחה"
    },
    auth: {
      username: "שם משתמש",
      email: "אימייל",
      password: "סיסמה",
      name: "שם מלא",
      phone: "מספר טלפון",
      loginWithGoogle: "התחבר עם גוגל",
      loginWithUsername: "התחבר עם שם משתמש",
      createAccount: "צור חשבון",
      alreadyHaveAccount: "כבר יש לך חשבון?",
      dontHaveAccount: "אין לך חשבון?"
    },
    home: {
      findBarbers: "מצא ספרים",
      searchByCity: "חפש לפי עיר",
      mapView: "תצוגת מפה",
      listView: "תצוגת רשימה",
      nearbyBarbers: "ספרים קרובים",
      topRated: "המדורגים ביותר"
    },
    barber: {
      services: "שירותים",
      products: "מוצרים",
      reviews: "ביקורות",
      gallery: "גלריה",
      about: "אודות",
      bookNow: "הזמן עכשיו",
      rating: "דירוג",
      open: "פתוח",
      closed: "סגור"
    },
    booking: {
      selectService: "בחר שירות",
      selectDate: "בחר תאריך",
      selectTime: "בחר זמן",
      addProducts: "הוסף מוצרים",
      totalPrice: "מחיר כולל",
      bookingNotes: "הערות הזמנה",
      confirmBooking: "אשר הזמנה",
      myBookings: "ההזמנות שלי",
      upcomingBookings: "הזמנות קרובות",
      pastBookings: "הזמנות קודמות"
    }
  }
};

export type Language = 'en' | 'ar' | 'he';
export type TranslationKey = keyof typeof translations.en;
