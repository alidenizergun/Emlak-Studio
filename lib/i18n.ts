import type { NextRequest } from 'next/server';

export type Language = 'tr' | 'en' | 'es';

export const LANGUAGE_COOKIE = 'site_lang';
export const DEFAULT_LANGUAGE: Language = 'tr';

export const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
    { value: 'tr', label: '🇹🇷 Türkçe' },
    { value: 'en', label: '🇬🇧 English' },
    { value: 'es', label: '🇪🇸 Español' },
];

export const LANGUAGE_LOCALES: Record<Language, string> = {
    tr: 'tr_TR',
    en: 'en_US',
    es: 'es_ES',
};

type TranslationRecord = Partial<Record<Exclude<Language, 'tr'>, string>>;

const TEXT_CATALOG: Record<string, TranslationRecord> = {
    'Studio Estate': { en: 'Studio Estate', es: 'Studio Estate' },
    'Studio Estate Logo': { en: 'Studio Estate Logo', es: 'Logotipo de Studio Estate' },
    'Emlak fotoğraflarınız için güçlü görsel çözümler.': {
        en: 'Powerful visual solutions for your real estate photos.',
        es: 'Soluciones visuales potentes para tus fotos inmobiliarias.',
    },
    'Tüm hakları saklıdır.': { en: 'All rights reserved.', es: 'Todos los derechos reservados.' },
    'Ürünler': { en: 'Products', es: 'Productos' },
    'Kurumsal': { en: 'Company', es: 'Empresa' },
    'Yasal': { en: 'Legal', es: 'Legal' },
    'Fotoğraf Geliştirme': { en: 'Photo Enhancement', es: 'Mejora Fotográfica' },
    'Dekorasyon': { en: 'Virtual Staging', es: 'Home Staging Virtual' },
    'Tüm araçlar': { en: 'All tools', es: 'Todas las herramientas' },
    'Hakkımızda': { en: 'About Us', es: 'Sobre Nosotros' },
    'Yardım Merkezi': { en: 'Help Center', es: 'Centro de Ayuda' },
    'Öneriler': { en: 'Suggestions', es: 'Sugerencias' },
    'İletişim': { en: 'Contact', es: 'Contacto' },
    'Gizlilik Politikası': { en: 'Privacy Policy', es: 'Política de Privacidad' },
    'Kullanım Şartları': { en: 'Terms of Use', es: 'Términos de Uso' },
    'kapak görseli': { en: 'cover image', es: 'imagen de portada' },
    'Emlak Fotoğraf ve İçerik Araçları': { en: 'Real Estate Photo and Content Tools', es: 'Herramientas de Foto y Contenido Inmobiliario' },
    'emlak fotoğraf geliştirme': { en: 'real estate photo enhancement', es: 'mejora de fotos inmobiliarias' },
    'sanal dekorasyon': { en: 'virtual staging', es: 'decoración virtual' },
    'akıllı eşya silme': { en: 'smart object removal', es: 'eliminación inteligente de objetos' },
    'ilan metni oluşturucu': { en: 'listing copy generator', es: 'generador de textos para anuncios' },
    'sanal tadilat': { en: 'virtual renovation', es: 'renovación virtual' },
    'Fiyatlandırma': { en: 'Pricing', es: 'Precios' },
    'Giriş Yap': { en: 'Log In', es: 'Iniciar sesión' },
    'Çıkış Yap': { en: 'Log Out', es: 'Cerrar sesión' },
    'Ücretsiz Deneyin': { en: 'Try for Free', es: 'Pruébalo Gratis' },
    'Stüdyo': { en: 'Studio', es: 'Studio' },
    'Tüm Araçlar': { en: 'All Tools', es: 'Todas las Herramientas' },
    'Yakında': { en: 'Coming Soon', es: 'Próximamente' },
    'Akıllı Eşya Silme': { en: 'Smart Object Removal', es: 'Eliminación Inteligente de Objetos' },
    'İlan Metni Oluşturucu': { en: 'Listing Copy Generator', es: 'Generador de Textos para Anuncios' },
    'Tadilat': { en: 'Virtual Renovation', es: 'Renovación Virtual' },
    'Sanal Sunucu': { en: 'Virtual Presenter', es: 'Presentador Virtual' },
    'Boş odaları Studio Estate ile istediğiniz tarz mobilyalarla döşeyin.': {
        en: 'Stage empty rooms with Studio Estate using the furniture style you choose.',
        es: 'Decora habitaciones vacías con Studio Estate en el estilo de mobiliario que elijas.',
    },
    'Düşük çözünürlüklü, karanlık fotoğrafları 4K kalitesine yükseltin.': {
        en: 'Upgrade low-resolution, dark photos to 4K quality.',
        es: 'Mejora fotos oscuras y de baja resolución a calidad 4K.',
    },
    'İstenmeyen eşyaları, dağınıklığı veya eski mobilyaları saniyeler içinde silin.': {
        en: 'Remove unwanted objects, clutter, or outdated furniture in seconds.',
        es: 'Elimina objetos no deseados, desorden o muebles anticuados en segundos.',
    },
    'Fotoğraflardan otomatik olarak profesyonel ilan açıklamaları yazın.': {
        en: 'Generate professional listing descriptions automatically from photos.',
        es: 'Genera descripciones profesionales de anuncios automáticamente a partir de fotos.',
    },
    'Duvarları, zeminleri veya mutfakları tamamen yenileyerek potansiyeli gösterin.': {
        en: 'Reveal potential by fully renovating walls, floors, or kitchens.',
        es: 'Muestra el potencial renovando por completo paredes, suelos o cocinas.',
    },
    'Sanal sunucu evin içinde gezer, mülk bilgilerini video olarak kullanıcılara aktarır.': {
        en: 'A virtual presenter walks through the property and explains the listing details on video.',
        es: 'Un presentador virtual recorre la propiedad y explica en video los detalles del anuncio.',
    },
    'Ana Sayfa': { en: 'Home', es: 'Inicio' },
    'Ücretsiz Kayıt Ol': { en: 'Create Free Account', es: 'Crear Cuenta Gratis' },
    'Türkiye\'nin dört bir yanından emlakçıların deneyimleri': {
        en: 'Experiences from real-estate professionals across Türkiye',
        es: 'Experiencias de profesionales inmobiliarios de toda Turquía',
    },
    'Emlak Fotoğraflarınızı': { en: 'Elevate Your', es: 'Mejora tus' },
    'Akıllı Düzenlemelerle': { en: 'Listing Photos with', es: 'Fotos Inmobiliarias con' },
    'Güçlendirin': { en: 'Smart Edits', es: 'Ediciones Inteligentes' },
    'İlanlarınız Daha Fazla Tıklansın': { en: 'Get More Clicks on Your Listings', es: 'Consigue Más Clics en tus Anuncios' },
    'Kaliteli görsellerle ilanınızın tıklanma oranını yükseltin.': {
        en: 'Increase click-through with stronger visuals.',
        es: 'Aumenta la tasa de clics con imágenes de mayor calidad.',
    },
    'Mülkün Potansiyelini Anında Gösterin': {
        en: 'Show the Property’s Potential Instantly',
        es: 'Muestra el Potencial del Inmueble al Instante',
    },
    'Boş alanları saniyeler içinde modern ve gerçekçi şekilde dekore edin.': {
        en: 'Stage empty spaces in seconds with modern, realistic design.',
        es: 'Decora espacios vacíos en segundos con un diseño moderno y realista.',
    },
    'Daha Hızlı ve Kârlı Satış Yapın': { en: 'Sell Faster and More Profitably', es: 'Vende Más Rápido y con Más Rentabilidad' },
    'Güçlü görsellerle ilan süresini kısaltın, pazarlık gücünüzü artırın.': {
        en: 'Shorten time on market and strengthen your negotiation power with better visuals.',
        es: 'Reduce el tiempo de venta y mejora tu poder de negociación con mejores imágenes.',
    },
    'Örnekleri İnceleyin': { en: 'Browse Examples', es: 'Ver Ejemplos' },
    'Boş Oda': { en: 'Empty Room', es: 'Habitación Vacía' },
    'Studio Estate ile Dekorasyon': { en: 'Staged with Studio Estate', es: 'Decorado con Studio Estate' },
    'Boş oda': { en: 'Empty room', es: 'Habitación vacía' },
    'Yapay zeka ile dekore edilmiş oda': { en: 'AI-staged room', es: 'Habitación decorada con IA' },
    'Studio Estate\'in avantajları': { en: 'Why Studio Estate Works', es: 'Ventajas de Studio Estate' },
    'Studio Estate ile ilgili sık sorulan sorulara yanıtlar ve kullanım rehberleri. Aradığınız konuyu aşağıdaki kategorilerden veya SSS bölümünden bulabilirsiniz.': {
        en: 'Answers to frequently asked questions and usage guides for Studio Estate. Find what you need from the categories below or the FAQ section.',
        es: 'Respuestas a las preguntas frecuentes y guías de uso de Studio Estate. Encuentra lo que buscas en las categorías de abajo o en la sección de preguntas frecuentes.',
    },
    'Destek ekibimiz size yardımcı olmaktan mutluluk duyar. İletişim sayfamızdan bize ulaşın.': {
        en: 'Our support team will be happy to help. Reach us through the contact page.',
        es: 'Nuestro equipo de soporte estará encantado de ayudarte. Contáctanos desde la página de contacto.',
    },
    'İlan incelemede artış': { en: 'Increase in listing views', es: 'Aumento en vistas del anuncio' },
    'Daha Fazla Arama': { en: 'More Buyer Leads', es: 'Más Consultas' },
    'İşlem Süresi': { en: 'Processing Time', es: 'Tiempo de Proceso' },
    'Maliyet Tasarrufu': { en: 'Cost Savings', es: 'Ahorro de Costes' },
    'Müşteri Memnuniyeti': { en: 'Customer Satisfaction', es: 'Satisfacción del Cliente' },
    'Başarılı İşlem': { en: 'Completed Projects', es: 'Proyectos Completados' },
    'Giriş Yapın': { en: 'Log In', es: 'Iniciar sesión' },
    'E-posta adresiniz ve şifreniz ile hesabınıza girin.': {
        en: 'Log into your account with your email and password.',
        es: 'Accede a tu cuenta con tu correo electrónico y tu contraseña.',
    },
    'E-posta': { en: 'Email', es: 'Correo electrónico' },
    'Şifre': { en: 'Password', es: 'Contraseña' },
    'En az 8 karakter': { en: 'At least 8 characters', es: 'Al menos 8 caracteres' },
    'Hesabınız yok mu?': { en: "Don't have an account?", es: '¿No tienes una cuenta?' },
    'Ücretsiz kayıt olun': { en: 'Sign up for free', es: 'Regístrate gratis' },
    'Giriş Yapılıyor...': { en: 'Signing in...', es: 'Iniciando sesión...' },
    'Tek hesapla tum araclar': { en: 'All your tools under one account', es: 'Todas tus herramientas en una sola cuenta' },
    'Fotoğraf geliştirme, dekorasyon, akilli esya silme ve ilan metni araclari ayni panelde sizi bekliyor.': {
        en: 'Photo enhancement, virtual staging, smart object removal, and renovation tools are ready for you in one dashboard.',
        es: 'Las herramientas de mejora fotográfica, home staging virtual, eliminación inteligente de objetos y renovación te esperan en un único panel.',
    },
    'Hizli kredi takibi': { en: 'Instant credit tracking', es: 'Seguimiento inmediato de créditos' },
    'Giris yaptiginiz anda kalan kredi ve gecmis calismalarinizi gorebilir, aktif araclara hemen donebilirsiniz.': {
        en: 'The moment you sign in, you can see your remaining credits and past work and jump back into the active tools immediately.',
        es: 'En cuanto inicies sesión, podrás ver tus créditos restantes y trabajos anteriores y volver enseguida a las herramientas activas.',
    },
    'Hesabınız var mı?': { en: 'Already have an account?', es: '¿Ya tienes una cuenta?' },
    'Giriş yapın': { en: 'Log in', es: 'Iniciar sesión' },
    'Ücretsiz Başlayın': { en: 'Start Free', es: 'Empieza Gratis' },
    'E-posta adresiniz ve şifreniz ile hesabınızı oluşturun.': {
        en: 'Create your account with your email and password.',
        es: 'Crea tu cuenta con tu correo electrónico y tu contraseña.',
    },
    'Kullanım koşullarını ve gizlilik politikasını kabul ediyorum.': {
        en: 'I accept the terms of use and privacy policy.',
        es: 'Acepto los términos de uso y la política de privacidad.',
    },
    'Hesap Oluştur': { en: 'Create Account', es: 'Crear Cuenta' },
    'Hesap Oluşturuluyor...': { en: 'Creating account...', es: 'Creando cuenta...' },
    'Hizli hesap olusturma': { en: 'Quick account setup', es: 'Creación rápida de cuenta' },
    'E-posta ve sifre ile saniyeler icinde hesabinizi olusturun, aktif araclara hemen ulasin.': {
        en: 'Create your account in seconds with email and password, then access the active tools right away.',
        es: 'Crea tu cuenta en segundos con correo electrónico y contraseña y accede enseguida a las herramientas activas.',
    },
    'MVP odakli kullanim': { en: 'Built for the MVP phase', es: 'Pensado para la etapa MVP' },
    'Ilk musteriler icin kredi ve paket tanimlarini birlikte yonetiyor, aktif araclari hizla yayina hazirliyoruz.': {
        en: 'For our first customers, we manage credits and package activation manually while getting the active tools ready for launch.',
        es: 'Para los primeros clientes, gestionamos manualmente los créditos y la activación de paquetes mientras dejamos listas para el lanzamiento las herramientas activas.',
    },
    'Konu veya soru ara...': { en: 'Search topic or question...', es: 'Busca un tema o una pregunta...' },
    'Yardım ara': { en: 'Search help', es: 'Buscar ayuda' },
    'Sıkça Sorulan Sorular': { en: 'Frequently Asked Questions', es: 'Preguntas Frecuentes' },
    'Cevabını bulamadın mı?': { en: "Didn't find your answer?", es: '¿No encontraste tu respuesta?' },
    'İletişime Geç': { en: 'Get in Touch', es: 'Ponte en Contacto' },
    'İş akışınızı hızlandıracak ve satışlarınızı artıracak tüm araçlar tek bir yerde.': {
        en: 'All the tools that speed up your workflow and boost sales in one place.',
        es: 'Todas las herramientas para acelerar tu flujo de trabajo y aumentar tus ventas en un solo lugar.',
    },
    'Kullanılabilir kredi': { en: 'Available credits', es: 'Créditos disponibles' },
    'Paketleri Gör': { en: 'View Plans', es: 'Ver Planes' },
    'Ayarlar': { en: 'Settings', es: 'Configuración' },
    'İlk müşteriler için kredi ve paket aktivasyonları manuel olarak yapılır.': {
        en: 'Credit and package activations are handled manually for early customers.',
        es: 'La activación de créditos y paquetes se gestiona manualmente para los primeros clientes.',
    },
    'İlk müşteriler için kredi ve paket aktivasyonlarini manuel olarak yapiyoruz. Ihtiyacinizi bize iletin, hesabinizi fatura ile aktive edelim.': {
        en: 'For early customers, we handle credit and package activations manually. Tell us what you need and we will activate your account via invoice.',
        es: 'Para los primeros clientes, gestionamos manualmente la activación de créditos y paquetes. Cuéntanos lo que necesitas y activaremos tu cuenta mediante factura.',
    },
    'Kalan kredi': { en: 'Remaining credits', es: 'Créditos restantes' },
    'Krediler anlık olarak senkronize edilir.': { en: 'Credits sync in real time.', es: 'Los créditos se sincronizan en tiempo real.' },
    'Aktivasyon Talep Et': { en: 'Request Activation', es: 'Solicitar Activación' },
    'Bizimle Iletisime Gecin': { en: 'Contact Us', es: 'Contáctanos' },
    'Tahmini aylik paket referansi: ₺{amount}': { en: 'Estimated monthly package reference: ₺{amount}', es: 'Referencia estimada del paquete mensual: ₺{amount}' },
    'Minimum {min}, maksimum {max} kredi ihtiyacinizi belirtebilirsiniz.': {
        en: 'You can tell us how many credits you need, between {min} and {max}.',
        es: 'Puedes indicarnos cuántos créditos necesitas, entre {min} y {max}.',
    },
    'Yükleniyor...': { en: 'Loading...', es: 'Cargando...' },
    'İndir': { en: 'Download', es: 'Descargar' },
    'Yeni Fotoğraf': { en: 'New Photo', es: 'Nueva Foto' },
    'Önizleme': { en: 'Preview', es: 'Vista previa' },
    'Farklı Görsel Seç': { en: 'Choose Another Image', es: 'Elegir Otra Imagen' },
    'Fotoğrafı Buraya Tıklayıp Yükleyin': { en: 'Click Here to Upload the Photo', es: 'Haz clic aquí para subir la foto' },
    'Fotoğrafları Buraya Tıklayıp Yükleyin': { en: 'Click Here to Upload Photos', es: 'Haz clic aquí para subir las fotos' },
    'Örnekleri Gör': { en: 'View Examples', es: 'Ver Ejemplos' },
    'Gecerli bir e-posta adresi girin': { en: 'Enter a valid email address', es: 'Introduce un correo electrónico válido' },
    'Sifre en az 8 karakter olmali': { en: 'Password must be at least 8 characters', es: 'La contraseña debe tener al menos 8 caracteres' },
    'Giris basarisiz. Lutfen tekrar deneyin.': { en: 'Login failed. Please try again.', es: 'Error al iniciar sesión. Vuelve a intentarlo.' },
    'Kayit basarisiz. Lutfen tekrar deneyin.': { en: 'Registration failed. Please try again.', es: 'El registro falló. Vuelve a intentarlo.' },
    'Devam etmek icin sartlari kabul etmelisiniz': { en: 'You must accept the terms to continue', es: 'Debes aceptar los términos para continuar' },
    'Yetersiz kredi. Lütfen kredi yükleyin.': { en: 'Not enough credits. Please add more credits.', es: 'Créditos insuficientes. Añade más créditos.' },
    'İşlem başarısız. Lütfen tekrar deneyin.': { en: 'The operation failed. Please try again.', es: 'La operación falló. Inténtalo de nuevo.' },
    'Bir hata oluştu. Lütfen tekrar deneyin.': { en: 'Something went wrong. Please try again.', es: 'Se produjo un error. Inténtalo de nuevo.' },
    'Oturum bulunamadı. Lütfen tekrar giriş yapın.': { en: 'Session not found. Please sign in again.', es: 'No se encontró la sesión. Inicia sesión de nuevo.' },
    'Geri bildirim gönderilemedi': { en: 'Feedback could not be sent', es: 'No se pudo enviar la opinión' },
    'İşlem başarısız oldu': { en: 'The operation failed', es: 'La operación falló' },
    'İşlem için giriş yapmanız gerekiyor': { en: 'You need to sign in to continue', es: 'Debes iniciar sesión para continuar' },
    'Görsel gerekli': { en: 'Image is required', es: 'La imagen es obligatoria' },
    'Metin İyi': { en: 'Looks Good', es: 'Se Ve Bien' },
    'Yeniden İyileştir': { en: 'Refine Again', es: 'Mejorar de Nuevo' },
    'Baştan Başla': { en: 'Start Over', es: 'Empezar de Nuevo' },
    'Geri bildiriminiz kaydedildi. Sonraki metinler bu veriye göre güçlendirilecek.': {
        en: 'Your feedback has been saved. Future texts will be improved using this signal.',
        es: 'Tu comentario se ha guardado. Los próximos textos se mejorarán con esta señal.',
    },
    'Fotoğrafları yükleyin ve ilan bilgilerini girin; Studio Estate profesyonel ilan metni üretsin.': {
        en: 'Upload photos and enter listing details so Studio Estate can generate professional listing copy.',
        es: 'Sube las fotos e introduce los datos del anuncio para que Studio Estate genere un texto profesional.',
    },
    'Kalite skoru': { en: 'Quality score', es: 'Puntuación de calidad' },
    'Metin daha özgün, formatlı ve bilgi kapsamı yüksek olmalı': {
        en: 'The text should be more original, better formatted, and richer in information.',
        es: 'El texto debe ser más original, mejor estructurado y más completo en información.',
    },
    'Metin başarılı': { en: 'The copy works well', es: 'El texto funciona bien' },
    'Yetersiz kredi': { en: 'Insufficient credits', es: 'Créditos insuficientes' },
    'Studio Estate fotoğraflarınızı analiz eder, ışık ve renk dengesini sağlar, çözünürlüğü 4K kaliteye yükseltir.': {
        en: 'Studio Estate analyzes your photos, improves lighting and color balance, and boosts resolution to 4K quality.',
        es: 'Studio Estate analiza tus fotos, mejora la iluminación y el balance de color y aumenta la resolución a calidad 4K.',
    },
    'Güvenli Fallback': { en: 'Safe Fallback', es: 'Modo Seguro Alternativo' },
    'AI Çıktısı': { en: 'AI Output', es: 'Resultado de IA' },
    'Uygulanan ayarlar: {labels}': { en: 'Applied settings: {labels}', es: 'Ajustes aplicados: {labels}' },
    'Bu fotoğrafta değişim sınırlı olabilir.': { en: 'Changes may be limited in this photo.', es: 'Los cambios pueden ser limitados en esta foto.' },
    'Araçlar': { en: 'Tools', es: 'Herramientas' },
    'Bir araç seçin.': { en: 'Select a tool.', es: 'Selecciona una herramienta.' },
    'Çalışmalarım': { en: 'My Work', es: 'Mis Trabajos' },
    'Tüm Çalışmalarım': { en: 'All My Work', es: 'Todos Mis Trabajos' },
    'Studio Estate Araçları': { en: 'Studio Estate Tools', es: 'Herramientas de Studio Estate' },
    'Contact Desk': { en: 'Contact Hub', es: 'Centro de Contacto' },
    'Sizin için doğru destek kanalını seçelim': { en: 'Let’s choose the right support channel for you', es: 'Elijamos el canal de soporte adecuado para ti' },
    'Teknik destekten kurumsal iş birliğine kadar tüm iletişim noktaları tek yerde. Hızlı, net ve takip edilebilir bir destek akışı sunuyoruz.': {
        en: 'From technical support to business collaboration, all contact points are in one place. We offer a fast, clear, and trackable support flow.',
        es: 'Desde soporte técnico hasta colaboración empresarial, todos los puntos de contacto están en un solo lugar. Ofrecemos un flujo de soporte rápido, claro y trazable.',
    },
    'Ortalama e-posta yanıtı': { en: 'Average email response', es: 'Respuesta media por correo' },
    'Canlı telefon desteği': { en: 'Live phone support', es: 'Soporte telefónico en vivo' },
    'Yardım merkezi erişimi': { en: 'Help center access', es: 'Acceso al centro de ayuda' },
    'Telefon Hattı': { en: 'Phone Line', es: 'Línea Telefónica' },
    'Acil destek ve satış öncesi sorular için doğrudan bağlanın.': { en: 'Connect directly for urgent support and pre-sales questions.', es: 'Conéctate directamente para soporte urgente y preguntas previas a la venta.' },
    'Hafta içi 09:00 - 18:00': { en: 'Weekdays 09:00 - 18:00', es: 'Días laborables 09:00 - 18:00' },
    'Teknik detaylar ve kurumsal talepler için yazılı destek alın.': { en: 'Get written support for technical details and business requests.', es: 'Obtén soporte por escrito para detalles técnicos y solicitudes corporativas.' },
    'Ortalama 2 saat içinde yanıt': { en: 'Average response within 2 hours', es: 'Respuesta media en 2 horas' },
    'Hızlı Çözüm Kütüphanesi': { en: 'Quick Solution Library', es: 'Biblioteca de Soluciones Rápidas' },
    'En çok sorulan konulara adım adım rehberlerden anında yanıt bulun.': { en: 'Find instant answers to the most common topics through step-by-step guides.', es: 'Encuentra respuestas instantáneas a los temas más comunes con guías paso a paso.' },
    '7/24 erişim': { en: '24/7 access', es: 'Acceso 24/7' },
    'Hemen Ulaş': { en: 'Reach Out Now', es: 'Contactar Ahora' },
    'Çözüm bulamadınız mı?': { en: 'Still need a solution?', es: '¿Aún no encuentras solución?' },
    'Yardım Merkezine Git': { en: 'Go to Help Center', es: 'Ir al Centro de Ayuda' },
    'İlan metni özelliği şu anda kullanılamıyor.': {
        en: 'The listing copy feature is currently unavailable.',
        es: 'La función de texto para anuncios no está disponible en este momento.',
    },
    'Studio Estate ile emlak görsellerinizi geliştirin, odaları dekore edin ve ilan metni oluşturun.': {
        en: 'Enhance your real-estate visuals, stage rooms, and present properties more effectively with Studio Estate.',
        es: 'Mejora tus imágenes inmobiliarias, decora habitaciones y presenta mejor tus propiedades con Studio Estate.',
    },
    'Studio Estate araçları: fotoğraf geliştirme, dekorasyon, akıllı eşya silme, tadilat, ilan metni ve sanal sunucu.': {
        en: 'Studio Estate tools: photo enhancement, virtual staging, smart object removal, renovation, and the upcoming virtual presenter.',
        es: 'Herramientas de Studio Estate: mejora fotográfica, home staging virtual, eliminación inteligente de objetos, renovación y el próximo presentador virtual.',
    },
    'Studio Estate kredi ve abonelik planlarını karşılaştırın.': {
        en: 'Compare Studio Estate credit and subscription plans.',
        es: 'Compara los planes de créditos y suscripción de Studio Estate.',
    },
    'Studio Estate kullanım rehberi, sıkça sorulan sorular ve destek içerikleri.': {
        en: 'Studio Estate usage guides, frequently asked questions, and support resources.',
        es: 'Guías de uso, preguntas frecuentes y recursos de soporte de Studio Estate.',
    },
    'Studio Estate müşteri hizmetleri ile iletişime geçin. Telefon ve e-posta desteği ile yanınızdayız.': {
        en: 'Get in touch with Studio Estate support. We are here with phone and email assistance.',
        es: 'Ponte en contacto con el soporte de Studio Estate. Estamos aquí para ayudarte por teléfono y correo electrónico.',
    },
    'Boş odaları Studio Estate ile mimariyi koruyarak dekore edin.': {
        en: 'Stage empty rooms with Studio Estate while preserving the original architecture.',
        es: 'Decora habitaciones vacías con Studio Estate manteniendo intacta la arquitectura original.',
    },
    'İstenmeyen eşyaları fotoğraflarınızdan doğal ve temiz sonuçlarla kaldırın.': {
        en: 'Remove unwanted objects from your photos with natural, clean results.',
        es: 'Elimina objetos no deseados de tus fotos con resultados naturales y limpios.',
    },
    'Fotoğraf ve mülk verilerine göre ilan metinlerini hızlıca oluşturun.': {
        en: 'Generate listing copy quickly using the photo and property details.',
        es: 'Genera textos para anuncios rápidamente a partir de la foto y los datos del inmueble.',
    },
    'Zemin, duvar ve yüzey yenileme çalışmalarıyla mülkün potansiyelini gösterin.': {
        en: 'Show the property’s potential through floor, wall, and surface renovation ideas.',
        es: 'Muestra el potencial del inmueble con renovaciones de suelos, paredes y superficies.',
    },
    'Işık, renk, netlik ve temizlik ayarlarıyla emlak fotoğraflarınızı geliştirin.': {
        en: 'Enhance your real-estate photos with lighting, color, clarity, and cleanup adjustments.',
        es: 'Mejora tus fotos inmobiliarias con ajustes de iluminación, color, nitidez y limpieza.',
    },
    'Tüm araçlara tek ekrandan erişin.': { en: 'Access all your tools from one screen.', es: 'Accede a todas tus herramientas desde una sola pantalla.' },
    'Studio Estate hesabınıza güvenli şekilde giriş yapın.': {
        en: 'Sign in to your Studio Estate account securely.',
        es: 'Inicia sesión en tu cuenta de Studio Estate de forma segura.',
    },
    'Studio Estate hesabınızı oluşturun ve çalışmalara başlayın.': {
        en: 'Create your Studio Estate account and start working.',
        es: 'Crea tu cuenta de Studio Estate y empieza a trabajar.',
    },
    'Başlarken': { en: 'Getting Started', es: 'Primeros Pasos' },
    'Kayıt, giriş ve ilk adımlar.': { en: 'Registration, sign-in, and your first steps.', es: 'Registro, inicio de sesión y primeros pasos.' },
    'Görsel iyileştirme, 4K yükseltme ve kullanım.': { en: 'Image enhancement, 4K upscaling, and usage tips.', es: 'Mejora de imagen, escalado a 4K y consejos de uso.' },
    'Oda tipi, tarz seçimi ve sonuç indirme.': { en: 'Room type, style selection, and downloading results.', es: 'Tipo de estancia, elección de estilo y descarga de resultados.' },
    'Hesaplar & Ödeme': { en: 'Accounts & Billing', es: 'Cuentas y Facturación' },
    'Kredi, abonelik, fatura ve iptal.': { en: 'Credits, subscription, invoicing, and cancellation.', es: 'Créditos, suscripción, facturación y cancelación.' },
    'Destek ekibi ve iletişim kanalları.': { en: 'Support team and contact channels.', es: 'Equipo de soporte y canales de contacto.' },
    'Studio Estate’ya nasıl kayıt olurum?': { en: 'How do I sign up for Studio Estate?', es: '¿Cómo me registro en Studio Estate?' },
    'Ana sayfadaki "Ücretsiz Deneyin" veya "Kayıt Ol" butonuna tıklayın. E-posta adresiniz ve şifreniz ile hesabınızı oluşturabilirsiniz. Kayıt sonrası hemen aktif araçları kullanmaya başlayabilirsiniz.': {
        en: 'Click "Try for Free" or "Sign Up" on the homepage. You can create your account with your email address and password, then start using the active tools right away.',
        es: 'Haz clic en "Pruébalo Gratis" o "Regístrate" en la página principal. Puedes crear tu cuenta con tu correo electrónico y contraseña y empezar a usar enseguida las herramientas activas.',
    },
    'Kredi nedir? Nasıl kullanılır?': { en: 'What is a credit and how is it used?', es: '¿Qué es un crédito y cómo se usa?' },
    '1 kredi, 1 görsel işlemi (örneğin 1 odanın sanal dekorasyonu veya 1 fotoğrafın geliştirilmesi) anlamına gelir. Abonelik planınıza göre aylık kredi alırsınız. Kredilerinizi panelden takip edebilir, işlem yaptıkça düşer.': {
        en: '1 credit equals 1 image task, such as staging one room or enhancing one photo. Your plan gives you monthly credits, and you can track the remaining balance from your dashboard as you use them.',
        es: '1 crédito equivale a 1 trabajo de imagen, como decorar virtualmente una habitación o mejorar una foto. Tu plan te da créditos mensuales y puedes seguir el saldo restante desde el panel a medida que los usas.',
    },
    'Fotoğraf Geliştirme’de hangi formatlar destekleniyor?': { en: 'Which file formats are supported in Photo Enhancement?', es: '¿Qué formatos se admiten en Mejora Fotográfica?' },
    'JPG, PNG ve WebP formatları desteklenmektedir. Önerilen minimum çözünürlük 800x600’dür. Yükleme sonrası çözünürlük yükseltme, parlaklık ve netlik gibi seçenekleri işaretleyip "Seçilenleri Uygula" ile işlemi başlatabilirsiniz.': {
        en: 'JPG, PNG, and WebP are supported. The recommended minimum resolution is 800x600. After uploading, select options like upscaling, brightness, and sharpness, then start the process with "Apply Selected".',
        es: 'Se admiten JPG, PNG y WebP. La resolución mínima recomendada es 800x600. Después de subir la imagen, puedes marcar opciones como escalado, brillo y nitidez y comenzar con "Aplicar Seleccionados".',
    },
    'Dekorasyon\'da oda tipi ve tarz nasıl seçilir?': { en: 'How do I choose the room type and style in Virtual Staging?', es: '¿Cómo elijo el tipo de estancia y el estilo en Home Staging Virtual?' },
    'Boş oda fotoğrafınızı yükledikten sonra "Oda Tipi" (Salon, Yatak Odası, Mutfak vb.) ve "Dekorasyon Tarzı" (Modern, Klasik, Minimal vb.) alanlarından seçim yapın. İsterseniz "Studio Estate Seçsin" ile otomatik öneri alabilirsiniz. "Dekorasyon Oluştur" butonuyla işlemi başlatın.': {
        en: 'After uploading your empty-room photo, choose a "Room Type" such as Living Room, Bedroom, or Kitchen, then select a "Staging Style" like Modern, Classic, or Minimal. If you prefer, you can use "Let Studio Estate Decide" for an automatic suggestion. Start the process with "Create Staging".',
        es: 'Después de subir la foto de la habitación vacía, elige un "Tipo de estancia" como salón, dormitorio o cocina y después un "Estilo de decoración" como moderno, clásico o minimalista. Si lo prefieres, puedes usar "Que Studio Estate decida" para recibir una sugerencia automática. Inicia el proceso con "Crear Decoración".',
    },
    'İşlem ne kadar sürer?': { en: 'How long does a job take?', es: '¿Cuánto tarda un proceso?' },
    'Çoğu işlem 30 saniye içinde tamamlanır. Yoğunluk durumunda birkaç dakika sürebilir. Tamamlandığında sonucu ekranda görüntüleyebilir ve indirebilirsiniz.': {
        en: 'Most jobs finish within about 30 seconds. During busy periods, they can take a few minutes. Once the process is complete, you can preview and download the result on screen.',
        es: 'La mayoría de los procesos se completan en unos 30 segundos. En momentos de alta demanda pueden tardar algunos minutos. Cuando termine, podrás ver y descargar el resultado en pantalla.',
    },
    'Aboneliğimi nasıl iptal ederim?': { en: 'How do I cancel my subscription?', es: '¿Cómo cancelo mi suscripción?' },
    'Hesap ayarlarından "Paket ve Aktivasyon" bölümüne giderek paketinizi kapatabilirsiniz. MVP döneminde aktivasyonlar manuel olduğu için değişiklikler destek ekibi ile birlikte hızlıca yönetilir.': {
        en: 'You can cancel your plan from the "Package & Activation" section in account settings. Since activations are managed manually during the MVP period, changes are handled quickly together with our support team.',
        es: 'Puedes cancelar tu plan desde la sección "Paquete y Activación" en la configuración de la cuenta. Como las activaciones se gestionan manualmente durante la etapa MVP, los cambios se coordinan rápidamente con nuestro equipo de soporte.',
    },
    'Destek ekibine nasıl ulaşırım?': { en: 'How can I reach the support team?', es: '¿Cómo puedo contactar con el equipo de soporte?' },
    'Yardım merkezinde cevabınızı bulamadıysanız İletişim sayfamızdan bize ulaşabilirsiniz. E-posta ve canlı destek (planınıza göre) seçenekleri mevcuttur.': {
        en: 'If you cannot find your answer in the Help Center, you can contact us from the Contact page. Email support and live support options are available depending on your plan.',
        es: 'Si no encuentras tu respuesta en el Centro de Ayuda, puedes contactarnos desde la página de Contacto. Hay opciones de soporte por correo y soporte en vivo según tu plan.',
    },
    'Bilinmeyen hata': { en: 'Unknown error', es: 'Error desconocido' },
    'İşlem başarısız': { en: 'Operation failed', es: 'La operación falló' },
    'Geçmiş fotoğrafları görmek için giriş yapın.': { en: 'Sign in to view your history.', es: 'Inicia sesión para ver tu historial.' },
    'Geçmiş getirilemedi': { en: 'History could not be loaded', es: 'No se pudo cargar el historial' },
    'Seçili {count} kaydı silmek istediğinizden emin misiniz?': { en: 'Are you sure you want to delete {count} selected items?', es: '¿Seguro que quieres eliminar {count} elementos seleccionados?' },
    'Silme işlemi başarısız': { en: 'Delete action failed', es: 'La eliminación falló' },
    'Boş odaları saniyeler içinde mobilyalandırın. Fotoğrafı yükleyin, oda tipini ve tarzını seçin, Studio Estate evinizi dekore etsin.': {
        en: 'Furnish empty rooms in seconds. Upload a photo, choose the room type and style, and let Studio Estate stage the space.',
        es: 'Amuebla habitaciones vacías en segundos. Sube una foto, elige el tipo de estancia y el estilo, y deja que Studio Estate la decore.',
    },
    'Filtreleyin, seçin, indirin veya silin.': { en: 'Filter, select, download, or delete.', es: 'Filtra, selecciona, descarga o elimina.' },
    'kayıt': { en: 'records', es: 'registros' },
    'seçili': { en: 'selected', es: 'seleccionados' },
    'Tümü': { en: 'All', es: 'Todos' },
    'Son 3 Ay': { en: 'Last 3 Months', es: 'Últimos 3 Meses' },
    'Son 30 Gün': { en: 'Last 30 Days', es: 'Últimos 30 Días' },
    'Son 7 Gün': { en: 'Last 7 Days', es: 'Últimos 7 Días' },
    'Bugün': { en: 'Today', es: 'Hoy' },
    'Tümünü Seç': { en: 'Select All', es: 'Seleccionar Todo' },
    'Seçilenleri İndir': { en: 'Download Selected', es: 'Descargar Seleccionados' },
    'Siliniyor...': { en: 'Deleting...', es: 'Eliminando...' },
    'Seçilenleri Sil': { en: 'Delete Selected', es: 'Eliminar Seleccionados' },
    'Geçmiş yükleniyor...': { en: 'Loading history...', es: 'Cargando historial...' },
    'Henüz işlenmiş fotoğraf bulunmuyor.': { en: 'No processed photos yet.', es: 'Todavía no hay fotos procesadas.' },
    'Bu tarih aralığında çalışma bulunamadı.': { en: 'No work found in this date range.', es: 'No se encontraron trabajos en este rango de fechas.' },
    'Çalışma': { en: 'Work Item', es: 'Trabajo' },
    'Yüklenen': { en: 'Uploaded', es: 'Subido' },
    'Yüklenen fotoğraf': { en: 'Uploaded photo', es: 'Foto subida' },
    'Görsel yok': { en: 'No image', es: 'No hay imagen' },
    'Çıktı': { en: 'Output', es: 'Resultado' },
    'İşlenmiş fotoğraf': { en: 'Processed photo', es: 'Foto procesada' },
    'Metin çıktısı indirilebilir': { en: 'Text output available for download', es: 'Salida de texto disponible para descargar' },
    'Daha fazla yükle': { en: 'Load more', es: 'Cargar más' },
    'Oda Tipi': { en: 'Room Type', es: 'Tipo de Estancia' },
    'Tasarım Tarzı': { en: 'Design Style', es: 'Estilo de Diseño' },
    '2 Kredi': { en: '2 Credits', es: '2 Créditos' },
    'Özel tarz isteği': { en: 'Custom style request', es: 'Solicitud de estilo personalizado' },
    'Örn: Japandi, açık meşe tonları, sade ve ferah...': { en: 'Example: Japandi, light oak tones, simple and airy...', es: 'Ejemplo: Japandi, tonos de roble claro, sencillo y luminoso...' },
    'Dekore Ediliyor...': { en: 'Staging...', es: 'Decorando...' },
    'Başlat': { en: 'Start', es: 'Iniciar' },
    'Kapat': { en: 'Close', es: 'Cerrar' },
    'Büyük önizleme': { en: 'Large preview', es: 'Vista previa ampliada' },
    'Tüm eşyaları sil': { en: 'Remove all objects', es: 'Eliminar todos los objetos' },
    '2 kredi': { en: '2 credits', es: '2 créditos' },
    'Belirli eşyaları aşağıdaki metne göre sil': { en: 'Remove specific objects based on the text below', es: 'Eliminar objetos específicos según el texto de abajo' },
    'Silmek istediğiniz eşyayı yazın': { en: 'Describe what you want to remove', es: 'Escribe qué quieres eliminar' },
    'Örnek: koltuğu sil, televizyonu sil, halıyı sil': { en: 'Example: remove the sofa, remove the TV, remove the rug', es: 'Ejemplo: elimina el sofá, elimina la televisión, elimina la alfombra' },
    'Nasıl çalışır?': { en: 'How does it work?', es: '¿Cómo funciona?' },
    'Fotoğrafı yükleyin. Yukarıdan tüm eşyaları silme veya sadece belirli eşyaları metne göre silme seçeneğini işaretleyin, ardından Başlat butonuna tıklayın.': {
        en: 'Upload the photo. Choose whether to remove all objects or only specific items based on your text, then click Start.',
        es: 'Sube la foto. Elige si quieres eliminar todos los objetos o solo algunos según el texto que escribas y luego haz clic en Iniciar.',
    },
    'Akıllı Eşya Silme Örneği': { en: 'Smart Object Removal Example', es: 'Ejemplo de Eliminación Inteligente de Objetos' },
    'Fotoğraftaki dağınıklık ve istenmeyen objeler korunacak alanlara zarar vermeden temizlenir.': {
        en: 'Clutter and unwanted objects are removed from the photo without affecting the areas that should stay intact.',
        es: 'El desorden y los objetos no deseados se eliminan de la foto sin afectar las zonas que deben conservarse.',
    },
    'Kredi iade edildi.': { en: 'The credit was refunded.', es: 'El crédito fue reembolsado.' },
    'Kredi düşülmedi.': { en: 'No credit was deducted.', es: 'No se descontó ningún crédito.' },
    'Studio Estate Seçsin': { en: 'Let Studio Estate Decide', es: 'Que Studio Estate Decida' },
    '5 kredi': { en: '5 credits', es: '5 créditos' },
    'Studio Estate en iyi ayarları seçsin': { en: 'Let Studio Estate choose the best settings', es: 'Deja que Studio Estate elija los mejores ajustes' },
    'Duvarları, zeminleri veya mutfakları tamamen yenileyin. Fotoğrafı yükleyin, yapay zeka tadilat sonrası görünümü oluştursun.': {
        en: 'Fully renew walls, floors, or kitchens. Upload the photo and let AI generate the renovated version.',
        es: 'Renueva por completo paredes, suelos o cocinas. Sube la foto y deja que la IA genere la versión renovada.',
    },
    'Ne tür tadilat istiyorsunuz?': { en: 'What kind of renovation do you want?', es: '¿Qué tipo de renovación quieres?' },
    'Örnek: Parkeler değişsin, duvarlar gri renge boyansın, mutfak dolapları yenilensin': {
        en: 'Example: replace the flooring, paint the walls grey, renew the kitchen cabinets',
        es: 'Ejemplo: cambiar el suelo, pintar las paredes de gris, renovar los armarios de la cocina',
    },
    'Fotoğrafı yükleyin, nasıl bir tadilat istediğinizi yukarıdaki alana yazın ve Başlat butonuna basın.': {
        en: 'Upload the photo, describe the renovation you want in the field above, and press Start.',
        es: 'Sube la foto, describe la renovación que quieres en el campo de arriba y pulsa Iniciar.',
    },
    'Tadilat Örneği': { en: 'Renovation Example', es: 'Ejemplo de Renovación' },
    'Eski görünümlü alanlar, yeni malzeme ve modern yüzeylerle tadilat sonrası hale dönüştürülür.': {
        en: 'Outdated spaces are transformed into a renovated look with new materials and modern surfaces.',
        es: 'Los espacios anticuados se transforman en una imagen renovada con materiales nuevos y superficies modernas.',
    },
    'Salon': { en: 'Living Room', es: 'Salón' },
    'Oturma Odası': { en: 'Sitting Room', es: 'Sala de Estar' },
    'Yatak Odası': { en: 'Bedroom', es: 'Dormitorio' },
    'Çocuk Odası': { en: 'Kids Room', es: 'Habitación Infantil' },
    'Misafir Odası': { en: 'Guest Room', es: 'Habitación de Invitados' },
    'Giyinme Odası': { en: 'Dressing Room', es: 'Vestidor' },
    'Çalışma Odası': { en: 'Home Office', es: 'Despacho' },
    'Oyun Odası': { en: 'Game Room', es: 'Sala de Juegos' },
    'Mutfak': { en: 'Kitchen', es: 'Cocina' },
    'Banyo': { en: 'Bathroom', es: 'Baño' },
    'Antre': { en: 'Entryway', es: 'Recibidor' },
    'Balkon Teras': { en: 'Balcony Terrace', es: 'Balcón o Terraza' },
    'Modern': { en: 'Modern', es: 'Moderno' },
    'İskandinav': { en: 'Scandinavian', es: 'Escandinavo' },
    'Endüstriyel': { en: 'Industrial', es: 'Industrial' },
    'Bohem': { en: 'Bohemian', es: 'Bohemio' },
    'Lüks': { en: 'Luxury', es: 'Lujo' },
    'Minimalist': { en: 'Minimalist', es: 'Minimalista' },
    'Klasik': { en: 'Classic', es: 'Clásico' },
    'Rustik': { en: 'Rustic', es: 'Rústico' },
    'Özel': { en: 'Custom', es: 'Personalizado' },
    'Dekorasyon Örneği': { en: 'Virtual Staging Example', es: 'Ejemplo de Home Staging Virtual' },
    'Fotoğraf Geliştirme Örneği': { en: 'Photo Enhancement Example', es: 'Ejemplo de Mejora Fotográfica' },
};

export function isLanguage(value: string | null | undefined): value is Language {
    return value === 'tr' || value === 'en' || value === 'es';
}

export function normalizeLanguage(value: string | null | undefined): Language {
    return DEFAULT_LANGUAGE;
}

export function translateText(lang: Language, text: string): string {
    if (lang === 'tr') return text;
    return TEXT_CATALOG[text]?.[lang] || text;
}

export function formatText(lang: Language, text: string, params: Record<string, string | number> = {}): string {
    let out = translateText(lang, text);
    for (const [key, value] of Object.entries(params)) {
        out = out.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
    return out;
}

export function resolveLanguage(value: string | null | undefined): Language {
    return DEFAULT_LANGUAGE;
}

export function getRequestLanguage(request: NextRequest): Language {
    return resolveLanguage(request.cookies.get(LANGUAGE_COOKIE)?.value || request.headers.get('x-site-lang'));
}
