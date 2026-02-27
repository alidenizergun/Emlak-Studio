export function getImageGenerationPolicy(allowArchitecturalChanges: boolean): string {
    const architectureRules = allowArchitecturalChanges
        ? `
- Mimari değişiklik sadece kullanıcı açıkça isterse uygulanabilir.
- Kullanıcının özellikle istemediği hiçbir mimari unsur (metrekare algısı, duvar, kolon, tavan, pencere, kapı, geometri) değiştirilmez.
`.trim()
        : `
- Mimariyi asla değiştirme: metrekare algısı, duvar konumları, kolon yerleri, tavan yüksekliği/şekli, pencere/kapı konumları ve tüm yapısal geometri korunmalı.
- Yapısal eleman ekleme, silme, taşıma veya şekil değiştirme yapma.
`.trim();

    return `
GLOBAL IMAGE POLICY (zorunlu):
${architectureRules}
- Kamera açısı, perspektif, kadraj ve lens karakteri korunmalı.
- Mimari sabitlik zorunlu: kolon, kiriş, duvar, pencere, kapı, tavan çizgileri ve oda oranları birebir korunmalı.
- Zemin temizliği zorunlu: kir, leke, iz, toz ve yüzeydeki dağınık görsel kirler temizlenmeli; zemin malzemesi ve derz yapısı korunmalı.
- Işık, pozlama, beyaz ayarı, netlik ve keskinliği üst seviye emlak fotoğrafı kalitesine getir.
- Temizlik ve kalite iyileştirmesi yaparken geometriyi bozma, geniş açı etkisi üretme veya odanın boyut algısını değiştirme.
- Çıktı fotogerçekçi olmalı; çizim/karikatür/AI-art görünümü olmamalı.
- İnsan, yeni yazı, yeni logo veya yeni watermark ekleme.
- Görselde mevcut logo/watermark varsa bu alanları bozma; asıl hedef mimariyi koruyarak kalite/temizlik iyileştirmesi yapmaktır.
- Herhangi bir kural çakışmasında mimariyi koruma önceliklidir.
`.trim();
}
