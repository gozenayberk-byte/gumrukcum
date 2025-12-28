import React from 'react';
import { PricingCard } from '../components/PricingCard';

interface LandingPageProps {
  onAuth: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAuth }) => {
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const testimonials = [
    {
      name: "Ahmet Yılmaz",
      role: "E-Ticaret Girişimcisi",
      text: "Çin'den elektronik ürün getirirken CE belgesi detayını burada öğrendim. Gümrükte malın takılmasını önledi, resmen hayat kurtardı.",
      initials: "AY"
    },
    {
      name: "Selin Kaya",
      role: "İthalat Uzmanı",
      text: "Gümrük müşavirine her basit soru için para ödemekten ve beklemekten bıkmıştım. Harika bir asistan, 7/24 yanımda.",
      initials: "SK"
    },
    {
      name: "Mert Demir",
      role: "Amazon FBA Satıcısı",
      text: "Fiyat analizi özelliği efsane. Çin'deki güncel FOB fiyatlarını saniyede bulup yerel pazarla kıyaslaması inanılmaz.",
      initials: "MD"
    },
    {
      name: "Ayşe Çelik",
      role: "Butik Sahibi",
      text: "GTIP tespiti nokta atışı. Gümrük memurları bile verdiğim kodun doğruluğuna şaşırdı. İşimi çok hızlandırdı.",
      initials: "AÇ"
    },
    {
      name: "Caner Öz",
      role: "Dış Ticaret Müdürü",
      text: "İşim gereği sürekli numune getiriyorum, hızlı risk kontrolü için birebir. Mevzuat uyarıları çok yerinde.",
      initials: "CÖ"
    },
    {
      name: "Zeynep Tekin",
      role: "Satın Alma Sorumlusu",
      text: "Profesyonel paketteki İngilizce mail taslağı ile Çinli tedarikçiyle pazarlıkta elim çok güçlendi.",
      initials: "ZT"
    },
    {
      name: "Volkan Arslan",
      role: "Teknoloji Mağazası Sahibi",
      text: "Vergi oranlarını kuruşu kuruşuna hesaplaması bütçe planlamamı kolaylaştırdı. Artık sürpriz maliyet çıkmıyor.",
      initials: "VA"
    },
    {
      name: "Elif Doğan",
      role: "Start-up Kurucusu",
      text: "Risk analizindeki 'Yasaklı Madde' uyarısı sayesinde gümrükte imha edilecek bir ürünü almaktan son anda vazgeçtim.",
      initials: "ED"
    },
    {
      name: "Burak Yıldız",
      role: "Dropshipping Uzmanı",
      text: "Telefondan bile rahatça kullanabiliyorum. Gümrük sahasında veya fuarda gezerken ürünün maliyetini anında görüyorum.",
      initials: "BY"
    }
  ];

  const faqs = [
    {
        q: "Veriler ne kadar güncel?",
        a: "Sistemimiz Resmi Gazete, Gümrük Yönetmeliği ve Ticaret Bakanlığı duyurularını günlük olarak tarar. Mevzuat değişiklikleri en geç 24 saat içinde sisteme yansır."
    },
    {
        q: "Resmi gümrük müşaviri yerine geçer mi?",
        a: "Hayır. Gumrukcum bir karar destek sistemidir. Ön araştırma, maliyet hesabı ve fizibilite için kullanılır. Resmi beyannameleriniz için yetkili gümrük müşaviri ile çalışmak yasal zorunluluktur."
    },
    {
        q: "GTIP kodu yanlış çıkarsa sorumluluk kabul ediyor musunuz?",
        a: "Yapay zeka %99 oranında doğru tespit yapsa da, nihai GTIP tespiti için Gümrük İdaresi'nden 'Bağlayıcı Tarife Bilgisi' (BTB) talep etmeniz önerilir. Sistemimiz tavsiye niteliğindedir."
    },
    {
        q: "İade politikanız nedir?",
        a: "Memnun kalmazsanız, paket satın alımını takip eden ilk 3 gün içinde bizimle iletişime geçerek sorgusuz sualsiz %100 ücret iadesi alabilirsiniz."
    },
    {
        q: "Hangi ülkelerden ithalatı kapsıyor?",
        a: "Şu anda Türkiye'ye yapılan tüm ithalat rejimlerini (Çin, Avrupa, ABD vb.) kapsamaktadır. İhracat mevzuatı yakında eklenecektir."
    },
    {
        q: "Kurumsal faturamı şirketime kesebilir misiniz?",
        a: "Elbette. Ödeme aşamasında şirket bilgilerinizi girdiğinizde %20 KDV dahil e-Arşiv faturanız otomatik olarak mail adresinize gönderilir."
    },
    {
        q: "Kredilerim sonraki aya devreder mi?",
        a: "Aylık paketlerde (Girişimci Paketi) kullanılmayan krediler ay sonunda sıfırlanır. Ancak ek paket alırsanız kullanım süresi uzatılabilir."
    },
    {
        q: "Profesyonel paketteki 'Fiyat Analizi' nasıl çalışıyor?",
        a: "AI motorumuz görselinizi kullanarak Alibaba, 1688 ve Made-in-China gibi global B2B sitelerini tarar, ortalama FOB fiyatını çıkarır. Eş zamanlı olarak Trendyol/Hepsiburada fiyatlarını çekerek size tahmini marj sunar."
    },
    {
        q: "Yasaklı veya izne tabi ürünleri görebiliyor muyum?",
        a: "Evet. Sistemimiz TAREKS, Tarım Bakanlığı İzni, TSE denetimi veya İthalatı Yasak olan ürünleri (örneğin bazı kozmetikler, kullanılmış eşyalar) tespit ettiğinde 'KIRMIZI ALARM' vererek sizi uyarır."
    },
    {
        q: "Mobilden kullanabilir miyim?",
        a: "Evet, Gumrukcum.net tam uyumlu (responsive) bir web uygulamasıdır. Telefonunuzdan fotoğraf çekip anında yükleyerek analiz yapabilirsiniz, uygulama indirmenize gerek yoktur."
    }
  ];

  return (
    <div id="home" className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 0. NEW HEADER / NAVIGATION */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                {/* Logo */}
                <div 
                    className="flex items-center gap-2 cursor-pointer" 
                    onClick={() => scrollToSection('home')}
                >
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">G</div>
                    <span className="text-slate-900 font-bold text-lg tracking-tight">Gumrukcum</span>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center space-x-8">
                    <button onClick={() => scrollToSection('home')} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Anasayfa</button>
                    <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Fiyatlar</button>
                    <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">SSS</button>
                </div>

                {/* Auth Button */}
                <div className="flex items-center">
                    <button 
                        onClick={onAuth} 
                        className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        Giriş Yap
                    </button>
                </div>
            </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="relative bg-slate-900 text-white overflow-hidden pb-16 pt-16">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-0 w-80 h-80 bg-teal-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col lg:flex-row items-center relative z-10 gap-12">
          <div className="lg:w-1/2">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-400/30 bg-indigo-900/30 text-indigo-300 text-sm font-medium mb-6 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 mr-2"></span>
              Yapay Zeka Destekli Gümrük Asistanı
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Gümrükte <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">Sürpriz Cezalara</span> Son Verin.
            </h1>
            <p className="text-lg text-slate-300 mb-8 max-w-lg leading-relaxed">
              Resmi gazete ve güncel mevzuata hakim yapay zeka ile ürünlerinizin GTIP kodunu saniyeler içinde öğrenin, vergileri hesaplayın ve ithalat risklerini sıfıra indirin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onAuth} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-1">
                Ücretsiz Analizi Dene
              </button>
              <button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all">
                Nasıl Çalışır?
              </button>
            </div>
            <div className="mt-8 flex items-center gap-4 text-sm text-slate-400">
                <div className="flex -space-x-2">
                    <img className="w-8 h-8 rounded-full border-2 border-slate-900" src="https://ui-avatars.com/api/?name=Ahmet+Y&background=c7d2fe&color=3730a3" alt="User" />
                    <img className="w-8 h-8 rounded-full border-2 border-slate-900" src="https://ui-avatars.com/api/?name=Selin+K&background=bfdbfe&color=1e3a8a" alt="User" />
                    <img className="w-8 h-8 rounded-full border-2 border-slate-900" src="https://ui-avatars.com/api/?name=Mert+D&background=bbf7d0&color=14532d" alt="User" />
                </div>
                <p>1000+ İthalatçı güvenle kullanıyor.</p>
            </div>
          </div>
          
          <div className="lg:w-1/2 relative perspective-1000">
             {/* Realistic Image with UI Overlay */}
             <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 group">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-80"></div>
                {/* 
                   Görsel: Yeşil Fitilli Kadife Terlik Temsili.
                   Gerçek projede kendi çektiğiniz görseli buraya src="/assets/yesil-terlik.jpg" olarak ekleyiniz.
                   Şimdilik en yakın temsili stok görseli kullanıyoruz.
                */}
                <img 
                    src="https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=2664&auto=format&fit=crop" 
                    alt="Yeşil Kadife Terlik Analizi" 
                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Overlay Card 1 */}
                <div className="absolute bottom-6 left-6 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50 max-w-xs animate-slideIn">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-100 p-2 rounded-lg text-green-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Analiz: Yeşil Kadife Ev Terliği</p>
                            <p className="text-sm font-bold text-slate-900">GTIP: 6404.19.90.00.19</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>Gümrük Vergisi:</span>
                            <span className="font-bold text-red-600">%20 + Ek Mali Yük.</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>KDV:</span>
                            <span className="font-bold text-slate-900">%10</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full w-full animate-progress"></div>
                        </div>
                    </div>
                </div>

                {/* Overlay Card 2 (Floating Badge) */}
                <div className="absolute top-6 right-6 z-20 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 transform rotate-2">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                     <span className="font-bold text-sm">Dikkat: Referans Fiyat</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 2. PAIN/SOLUTION FUNNEL */}
      <section className="py-24 bg-white relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">Bilgisizce Yapılan İthalat Kumardır</h2>
            <p className="text-lg text-slate-600">Gümrük mevzuatı karmaşıktır. Tek bir evrak eksiği ürünlerinizin antrepoda çürümesine neden olabilir.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Problem Card */}
            <div className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-2xl">⛔️</div>
                <h3 className="text-xl font-bold text-slate-900">Klasik Senaryo</h3>
              </div>
              <p className="text-slate-600 mb-4 leading-relaxed">Çin'den "ucuz" diye sipariş verdiğiniz ürün gümrüğe gelir. Gümrük memuru aniden <strong className="text-slate-900">TSE belgesi</strong> sorar.</p>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-red-800 text-sm font-semibold">Sonuç: Ürünler antrepoda kalır, binlerce dolar ardiye ve imha masrafı ödersiniz.</p>
              </div>
            </div>

            {/* Solution Card */}
            <div className="group bg-white p-8 rounded-2xl border border-indigo-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden ring-4 ring-indigo-50">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl">✅</div>
                <h3 className="text-xl font-bold text-slate-900">Gumrukcum Yöntemi</h3>
              </div>
              <p className="text-slate-600 mb-4 leading-relaxed">Siparişten önce görseli yüklersiniz. Yapay zeka <strong className="text-slate-900">"Bu ürün TAREKS denetimine tabidir"</strong> uyarısını verir.</p>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <p className="text-indigo-900 text-sm font-semibold">Sonuç: Evrakları önceden hazırlarsınız. Ürün gümrükten transit geçer. Sürpriz yok.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <p className="inline-block bg-slate-100 text-slate-800 px-6 py-3 rounded-full text-lg font-medium border border-slate-200">
               Sadece <span className="text-indigo-600 font-bold">399 TL</span> (2 Kahve Fiyatı) ödeyerek sermayenizi koruyun.
            </p>
          </div>
        </div>
      </section>

      {/* 3. TESTIMONIALS */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Gerçek Kullanıcı Deneyimleri</h2>
                <p className="text-slate-500">Yüzlerce ithalatçı ve girişimci gümrük süreçlerini bizimle yönetiyor.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((t, i) => (
                    <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg mr-4 border border-indigo-200">
                                {t.initials}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{t.name}</h4>
                                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">{t.role}</p>
                            </div>
                        </div>
                        <div className="relative">
                            <svg className="absolute -top-2 -left-2 w-6 h-6 text-slate-200 transform -scale-x-100" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true"><path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" /></svg>
                            <p className="text-slate-600 italic leading-relaxed pl-4">{t.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 4. COMPACT & VIBRANT PRICING (Updated) */}
      <section id="pricing" className="py-20 bg-indigo-50/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
                Basit Fiyatlandırma
              </h2>
              <p className="text-slate-500">
                Aklınızdaki ithalat planına uygun paketi seçin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-center">
                <PricingCard 
                    title="Başlangıç" 
                    price="Ücretsiz" 
                    tierName="free"
                    features={["2 Ücretsiz Kredi", "Temel GTIP Tespiti", "Standart Vergi Hesabı"]} 
                    onSelect={onAuth} 
                />
                <PricingCard 
                    title="Girişimci" 
                    price="399" 
                    tierName="entrepreneur"
                    isPopular 
                    features={["50 Sorgu / Ay", "Mevzuat Risk Analizi", "Gerekli Belgeler Listesi", "Gelişmiş Vergi Hesabı", "7/24 AI Desteği"]} 
                    onSelect={onAuth} 
                />
                <PricingCard 
                    title="Profesyonel" 
                    price="2499" 
                    tierName="professional"
                    features={["Sınırsız Sorgu", "Pazar Yeri Fiyat Analizi", "Çin FOB Fiyat Araştırması", "İngilizce Mail Taslakları", "Öncelikli Destek"]} 
                    onSelect={onAuth} 
                />
            </div>
        </div>
      </section>

      {/* 5. FAQ */}
      <section id="faq" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-10 text-slate-900 text-center">Sıkça Sorulan Sorular</h2>
            <div className="space-y-4">
                {faqs.map((faq, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden hover:border-slate-200 transition-colors">
                        <details className="group p-6 cursor-pointer">
                            <summary className="flex justify-between items-center font-semibold text-slate-900 list-none">
                                <span>{faq.q}</span>
                                <span className="transition group-open:rotate-180 text-slate-400">
                                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                </span>
                            </summary>
                            <p className="text-slate-600 mt-4 leading-relaxed group-open:animate-fadeIn">
                                {faq.a}
                            </p>
                        </details>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="py-20 bg-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Her Ürün İçin Gümrük Müşavirine Binlerce Lira Ödemekten Kurtulun</h2>
            <p className="text-indigo-100 text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto">
                Sadece aklınızdaki ürün fikirlerini test etmek için müşavirinize danışmanlık ücreti ödemeyin. 
                <span className="font-semibold text-white"> Gumrukcum</span> ile ön analizi kendiniz yapın, maliyetini çıkarın. 
                Sadece kesin siparişleriniz için müşavirinize gidin.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={onAuth} className="bg-white text-indigo-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition shadow-lg transform hover:-translate-y-1">
                    Hemen Tasarrufa Başla
                </button>
            </div>
            <p className="mt-6 text-sm text-indigo-300 opacity-80">
                *İlk 2 analiziniz tamamen ücretsizdir. Kredi kartı gerekmez.
            </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
                 <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">G</div>
                 <span className="text-white font-bold text-xl tracking-tight">Gumrukcum.net</span>
            </div>
            <p className="mb-8 text-slate-500 max-w-sm mx-auto">İthalat süreçlerinizi yapay zeka ile basitleştirin, maliyetlerinizi düşürün.</p>
            <div className="flex justify-center flex-wrap gap-8 mb-8 text-sm font-medium">
                <a href="#" className="hover:text-white transition-colors">Kullanım Koşulları</a>
                <a href="#" className="hover:text-white transition-colors">Gizlilik Sözleşmesi</a>
                <a href="#" className="hover:text-white transition-colors">İptal ve İade</a>
                <a href="#" className="hover:text-white transition-colors">İletişim</a>
            </div>
            
            {/* PAYMENT LOGOS */}
            <div className="flex items-center justify-center gap-6 mb-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                <div className="flex items-center gap-2">
                   <span className="text-white font-bold text-xl flex items-center gap-1">
                      <span className="text-blue-500">iyzico</span>
                   </span>
                   <span className="text-xs text-slate-400 border-l border-slate-600 pl-2 ml-1">ile Öde</span>
                </div>
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" alt="Amex" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Troy_logo.png" alt="Troy" className="h-6" />
            </div>

            <p className="text-xs text-slate-600">&copy; 2024 Gumrukcum Teknoloji A.Ş. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;