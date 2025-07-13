"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shuffle, RotateCcw, Sparkles, Moon, Sun, Star, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface TarotCard {
  name: string
  name_short: string
  value: string
  value_int: number
  meaning_up: string
  meaning_rev: string
  desc: string
  type: string
  suit?: string
  // Türkçe çeviriler
  name_tr: string
  meaning_up_tr: string
  meaning_rev_tr: string
  desc_tr: string
  suit_tr?: string
}

interface DrawnCard extends TarotCard {
  id: string
  reversed: boolean
  position: number
  image_url: string
}

const SPREAD_POSITIONS = [
  {
    name: "Geçmiş",
    description: "Bu durumu etkileyen geçmiş deneyimleriniz",
    icon: "🕰️",
  },
  {
    name: "Şimdi",
    description: "Mevcut durumunuz ve şu anki enerjiniz",
    icon: "⭐",
  },
  {
    name: "Gelecek",
    description: "Gelecekte sizi bekleyen fırsatlar",
    icon: "🔮",
  },
]

// Kapsamlı Türkçe çeviriler - Tüm kartlar için fallback değerler
const TURKISH_TRANSLATIONS: Record<string, any> = {
  // Büyük Arkana
  "The Fool": {
    name_tr: "Deli",
    meaning_up_tr: "masumiyet, yeni başlangıçlar, özgür ruh, spontanlık, macera, cesaret",
    meaning_rev_tr: "düşüncesizlik, aldanma, dikkatsizlik, aşırı risk alma, naiflik",
    desc_tr:
      "Deli kartı yeni başlangıçları, geleceğe olan inancı ve evrenin gücüne olan güveni temsil eder. Hayatınızda yeni bir sayfa açma zamanının geldiğini gösterir.",
  },
  "The Magician": {
    name_tr: "Büyücü",
    meaning_up_tr: "irade gücü, arzu, yaratım, tezahür, beceri, güç, odaklanma",
    meaning_rev_tr: "aldatma, illüzyon, gerçeklikten kopma, manipülasyon, güç kaybı",
    desc_tr:
      "Büyücü kartı tezahür, beceriklilik ve hedeflerinize ulaşmak için evrenin gücünden yararlanma yeteneğinizi gösterir.",
  },
  "The High Priestess": {
    name_tr: "Yüksek Rahibe",
    meaning_up_tr: "sezgi, bilinçaltı, iç ses, gizli bilgi, kadınsı enerji, mistisizm",
    meaning_rev_tr: "merkez kaybı, kayıp iç ses, bastırılmış duygular, sezgi eksikliği",
    desc_tr:
      "Yüksek Rahibe sezgiyi, kutsal bilgiyi ve görünen ile görünmeyen alemler arasındaki bağlantıyı temsil eder.",
  },
  "The Empress": {
    name_tr: "İmparatoriçe",
    meaning_up_tr: "annelik, bereket, doğa, yaratıcılık, bolluk, besleyicilik",
    meaning_rev_tr: "bağımlılık, boğuculuk, boşluk, kısırlık, yaratıcılık eksikliği",
    desc_tr: "İmparatoriçe anneliği, bereketi, doğayı ve besleyici enerjiyi temsil eder.",
  },
  "The Emperor": {
    name_tr: "İmparator",
    meaning_up_tr: "otorite, yapı, kontrol, babalık, liderlik, düzen, kararlılık",
    meaning_rev_tr: "zorbalık, katılık, soğukluk, otoriter davranış, kontrol kaybı",
    desc_tr: "İmparator otoriteyi, yapıyı, kontrolü ve babalığı temsil eder.",
  },
  "The Hierophant": {
    name_tr: "Aziz",
    meaning_up_tr: "gelenek, uyum, ahlak, etik, ruhani rehberlik, öğretim",
    meaning_rev_tr: "isyan, yıkıcılık, yeni yaklaşımlar, geleneklere karşı çıkma",
    desc_tr: "Aziz geleneği, uyumu, ahlakı ve etiği temsil eder.",
  },
  "The Lovers": {
    name_tr: "Aşıklar",
    meaning_up_tr: "aşk, birlik, ilişkiler, değer uyumu, seçim yapma, uyum",
    meaning_rev_tr: "uyumsuzluk, dengesizlik, değer çatışması, ilişki sorunları",
    desc_tr: "Aşıklar aşkı, birliği, ilişkileri ve değer uyumunu temsil eder.",
  },
  "The Chariot": {
    name_tr: "Savaş Arabası",
    meaning_up_tr: "kontrol, irade gücü, başarı, kararlılık, zafer, ilerleme",
    meaning_rev_tr: "kontrol kaybı, yön kaybı, saldırganlık, başarısızlık",
    desc_tr: "Savaş Arabası kontrolü, irade gücünü, başarıyı ve kararlılığı temsil eder.",
  },
  Strength: {
    name_tr: "Güç",
    meaning_up_tr: "iç güç, cesaret, merhamet, odaklanma, sabır, dayanıklılık",
    meaning_rev_tr: "kendinden şüphe, zayıflık, güvensizlik, sabırsızlık",
    desc_tr: "Güç kartı iç gücü, cesareti, merhemeti ve odaklanmayı temsil eder.",
  },
  "The Hermit": {
    name_tr: "Ermiş",
    meaning_up_tr: "ruh arayışı, iç gözlem, iç rehberlik, bilgelik, yalnızlık",
    meaning_rev_tr: "izolasyon, yalnızlık, geri çekilme, rehberlik reddi",
    desc_tr: "Ermiş ruh arayışını, iç gözlemi ve iç rehberliği temsil eder.",
  },
  "Wheel of Fortune": {
    name_tr: "Kader Çarkı",
    meaning_up_tr: "şans, karma, yaşam döngüleri, kader, değişim, fırsat",
    meaning_rev_tr: "şanssızlık, kontrol kaybı, kontrole tutunma, kötü karma",
    desc_tr: "Kader Çarkı şansı, karmayı, yaşam döngülerini ve kaderi temsil eder.",
  },
  Justice: {
    name_tr: "Adalet",
    meaning_up_tr: "adalet, eşitlik, gerçek, sebep ve sonuç, denge, doğruluk",
    meaning_rev_tr: "adaletsizlik, sorumluluk eksikliği, dürüstsüzlük, dengesizlik",
    desc_tr: "Adalet kartı adaleti, eşitliği, gerçeği ve sebep-sonuç ilişkisini temsil eder.",
  },
  "The Hanged Man": {
    name_tr: "Asılan Adam",
    meaning_up_tr: "bekleme, teslim olma, farklı bakış açısı, fedakarlık, sabır",
    meaning_rev_tr: "gecikme, direnç, kaçırılan fırsatlar, sabırsızlık",
    desc_tr: "Asılan Adam beklemeyı, teslim olmayı ve farklı perspektiflerden bakmayı temsil eder.",
  },
  Death: {
    name_tr: "Ölüm",
    meaning_up_tr: "dönüşüm, geçiş, değişim, yeniden doğuş, son, başlangıç",
    meaning_rev_tr: "değişime direnç, durgunluk, geçişten kaçınma, korku",
    desc_tr: "Ölüm kartı dönüşümü, değişimi ve yeni başlangıçları temsil eder.",
  },
  Temperance: {
    name_tr: "Ölçülülük",
    meaning_up_tr: "denge, uyum, sabır, ılımlılık, birleştirme, şifa",
    meaning_rev_tr: "dengesizlik, aşırılık, sabırsızlık, uyumsuzluk",
    desc_tr: "Ölçülülük dengeyi, uyumu ve sabırlı yaklaşımı temsil eder.",
  },
  "The Devil": {
    name_tr: "Şeytan",
    meaning_up_tr: "bağımlılık, kısıtlama, maddi takıntılar, tutsaklık, obsesyon",
    meaning_rev_tr: "özgürleşme, kontrol geri alma, bağımlılıktan kurtulma, uyanış",
    desc_tr: "Şeytan kartı bağımlılıkları, kısıtlamaları ve maddi takıntıları temsil eder.",
  },
  "The Tower": {
    name_tr: "Kule",
    meaning_up_tr: "ani değişim, yıkım, aydınlanma, gerçeğin ortaya çıkması, şok",
    meaning_rev_tr: "kişisel dönüşüm, kaçınılan felaket, iç değişim, direnç",
    desc_tr: "Kule ani değişimleri, yıkımları ve gerçeğin ortaya çıkmasını temsil eder.",
  },
  "The Star": {
    name_tr: "Yıldız",
    meaning_up_tr: "umut, ilham, ruhsal rehberlik, yenileme, iyileşme, barış",
    meaning_rev_tr: "umutsuzluk, inançsızlık, ruhsal bağlantı kaybı, hayal kırıklığı",
    desc_tr: "Yıldız umut, ilham ve ruhsal rehberliği temsil eder.",
  },
  "The Moon": {
    name_tr: "Ay",
    meaning_up_tr: "illüzyon, korku, bilinçaltı, sezgi, belirsizlik, gizem",
    meaning_rev_tr: "gerçeğin ortaya çıkması, korkuların aşılması, netlik, aydınlanma",
    desc_tr: "Ay kartı illüzyonları, korkuları ve bilinçaltı mesajları temsil eder.",
  },
  "The Sun": {
    name_tr: "Güneş",
    meaning_up_tr: "neşe, başarı, canlılık, pozitiflik, aydınlanma, mutluluk",
    meaning_rev_tr: "geçici bulutlar, gecikmiş mutluluk, iç neşe, gölgeli dönem",
    desc_tr: "Güneş neşeyi, başarıyı, canlılığı ve pozitifliği temsil eder.",
  },
  Judgement: {
    name_tr: "Mahkeme",
    meaning_up_tr: "yargı, yeniden doğuş, iç çağrı, affetme, uyanış",
    meaning_rev_tr: "kendini yargılama, geçmişte takılma, çağrıyı kaçırma, pişmanlık",
    desc_tr: "Mahkeme yargıyı, yeniden doğuşu ve iç çağrıyı temsil eder.",
  },
  "The World": {
    name_tr: "Dünya",
    meaning_up_tr: "tamamlanma, başarı, seyahat, dünya bilinci, bütünlük",
    meaning_rev_tr: "eksik tamamlanma, hedeflere ulaşamama, gecikme, engeller",
    desc_tr: "Dünya kartı tamamlanmayı, başarıyı ve dünya bilincini temsil eder.",
  },

  // Küçük Arkana Takımları
  wands: { suit_tr: "Değnekler" },
  cups: { suit_tr: "Kupalar" },
  swords: { suit_tr: "Kılıçlar" },
  pentacles: { suit_tr: "Pentagramlar" },

  // Küçük Arkana Kartları - Değnekler
  "Ace of Wands": {
    name_tr: "Değnekler Ası",
    meaning_up_tr: "yeni başlangıç, yaratıcılık, ilham, enerji, potansiyel",
    meaning_rev_tr: "gecikme, yaratıcılık eksikliği, motivasyon kaybı",
    desc_tr: "Değnekler Ası yeni projelerin ve yaratıcı enerjinin başlangıcını temsil eder.",
  },
  "Two of Wands": {
    name_tr: "İki Değnek",
    meaning_up_tr: "planlama, gelecek planları, kişisel güç, kontrol",
    meaning_rev_tr: "plansızlık, korku, kontrol kaybı",
    desc_tr: "İki Değnek gelecek planlarını ve kişisel gücü temsil eder.",
  },
  "Three of Wands": {
    name_tr: "Üç Değnek",
    meaning_up_tr: "genişleme, öngörü, denizaşırı fırsatlar, liderlik",
    meaning_rev_tr: "gecikme, engeller, planlarda aksaklık",
    desc_tr: "Üç Değnek genişleme ve uzun vadeli planları temsil eder.",
  },
  "Four of Wands": {
    name_tr: "Dört Değnek",
    meaning_up_tr: "kutlama, ev, topluluk, istikrar, başarı",
    meaning_rev_tr: "ev sorunları, istikrarsızlık, gecikmiş kutlama",
    desc_tr: "Dört Değnek ev, aile ve kutlamaları temsil eder.",
  },
  "Five of Wands": {
    name_tr: "Beş Değnek",
    meaning_up_tr: "çatışma, rekabet, anlaşmazlık, mücadele",
    meaning_rev_tr: "çatışmadan kaçınma, iç çatışma, uyum",
    desc_tr: "Beş Değnek rekabet ve çatışmaları temsil eder.",
  },
  "Six of Wands": {
    name_tr: "Altı Değnek",
    meaning_up_tr: "zafer, tanınma, başarı, liderlik, gurur",
    meaning_rev_tr: "başarısızlık, tanınmama, ego sorunları",
    desc_tr: "Altı Değnek zafer ve tanınmayı temsil eder.",
  },
  "Seven of Wands": {
    name_tr: "Yedi Değnek",
    meaning_up_tr: "savunma, meydan okuma, sebat, kararlılık",
    meaning_rev_tr: "teslim olma, güvensizlik, ezilme",
    desc_tr: "Yedi Değnek savunma ve kararlılığı temsil eder.",
  },
  "Eight of Wands": {
    name_tr: "Sekiz Değnek",
    meaning_up_tr: "hız, hareket, ilerleme, haber, seyahat",
    meaning_rev_tr: "gecikme, sabırsızlık, engeller",
    desc_tr: "Sekiz Değnek hızlı gelişmeleri ve hareketi temsil eder.",
  },
  "Nine of Wands": {
    name_tr: "Dokuz Değnek",
    meaning_up_tr: "dayanıklılık, sebat, savunma, son çaba",
    meaning_rev_tr: "tükenmişlik, paranoya, pes etme",
    desc_tr: "Dokuz Değnek dayanıklılık ve son çabayı temsil eder.",
  },
  "Ten of Wands": {
    name_tr: "On Değnek",
    meaning_up_tr: "yük, sorumluluk, tükenmişlik, başarı yakın",
    meaning_rev_tr: "yükten kurtulma, sorumluluk reddi, tükenmişlik",
    desc_tr: "On Değnek ağır yükleri ve sorumluluğu temsil eder.",
  },
  "Page of Wands": {
    name_tr: "Değnekler Prensi",
    meaning_up_tr: "coşku, keşif, özgürlük, mesaj",
    meaning_rev_tr: "sabırsızlık, plansızlık, kötü haber",
    desc_tr: "Değnekler Prensi coşku ve keşfi temsil eder.",
  },
  "Knight of Wands": {
    name_tr: "Değnekler Şövalyesi",
    meaning_up_tr: "macera, dürtüsellik, enerji, cesaret",
    meaning_rev_tr: "düşüncesizlik, sabırsızlık, saldırganlık",
    desc_tr: "Değnekler Şövalyesi macera ve dürtüselliği temsil eder.",
  },
  "Queen of Wands": {
    name_tr: "Değnekler Kraliçesi",
    meaning_up_tr: "güven, kararlılık, canlılık, bağımsızlık",
    meaning_rev_tr: "kıskançlık, güvensizlik, bencillik",
    desc_tr: "Değnekler Kraliçesi güven ve kararlılığı temsil eder.",
  },
  "King of Wands": {
    name_tr: "Değnekler Kralı",
    meaning_up_tr: "liderlik, vizyon, girişimcilik, karizma",
    meaning_rev_tr: "zorbalık, sabırsızlık, ego",
    desc_tr: "Değnekler Kralı liderlik ve vizyonu temsil eder.",
  },

  // Kupalar
  "Ace of Cups": {
    name_tr: "Kupalar Ası",
    meaning_up_tr: "yeni aşk, duygusal başlangıç, sezgi, ruhsal uyanış",
    meaning_rev_tr: "duygusal blokaj, aşk kaybı, boşluk",
    desc_tr: "Kupalar Ası yeni duygusal başlangıçları temsil eder.",
  },
  "Two of Cups": {
    name_tr: "İki Kupa",
    meaning_up_tr: "aşk, ortaklık, birlik, uyum, bağlantı",
    meaning_rev_tr: "ayrılık, uyumsuzluk, dengesizlik",
    desc_tr: "İki Kupa aşk ve ortaklığı temsil eder.",
  },
  "Three of Cups": {
    name_tr: "Üç Kupa",
    meaning_up_tr: "dostluk, kutlama, topluluk, neşe, paylaşım",
    meaning_rev_tr: "yalnızlık, dedikodu, grup çatışması",
    desc_tr: "Üç Kupa dostluk ve kutlamaları temsil eder.",
  },
  "Four of Cups": {
    name_tr: "Dört Kupa",
    meaning_up_tr: "kayıtsızlık, meditasyon, yeniden değerlendirme",
    meaning_rev_tr: "motivasyon, yeni fırsatlar, uyanış",
    desc_tr: "Dört Kupa kayıtsızlık ve iç gözlemi temsil eder.",
  },
  "Five of Cups": {
    name_tr: "Beş Kupa",
    meaning_up_tr: "kayıp, yas, hayal kırıklığı, pişmanlık",
    meaning_rev_tr: "iyileşme, affetme, ileriye bakma",
    desc_tr: "Beş Kupa kayıp ve yas sürecini temsil eder.",
  },
  "Six of Cups": {
    name_tr: "Altı Kupa",
    meaning_up_tr: "nostalji, çocukluk, masumiyet, geçmiş",
    meaning_rev_tr: "geçmişte takılma, çocuksuluk, gerçekçi olmama",
    desc_tr: "Altı Kupa nostalji ve çocukluk anılarını temsil eder.",
  },
  "Seven of Cups": {
    name_tr: "Yedi Kupa",
    meaning_up_tr: "seçenekler, hayal, illüzyon, kararsızlık",
    meaning_rev_tr: "netlik, odaklanma, gerçekçilik",
    desc_tr: "Yedi Kupa seçenekler ve hayalleri temsil eder.",
  },
  "Eight of Cups": {
    name_tr: "Sekiz Kupa",
    meaning_up_tr: "terk etme, arayış, hayal kırıklığı, yolculuk",
    meaning_rev_tr: "korku, kaçınma, terk etmeme",
    desc_tr: "Sekiz Kupa terk etme ve arayışı temsil eder.",
  },
  "Nine of Cups": {
    name_tr: "Dokuz Kupa",
    meaning_up_tr: "memnuniyet, mutluluk, başarı, tatmin",
    meaning_rev_tr: "açgözlülük, tatminsizlik, yüzeysellik",
    desc_tr: "Dokuz Kupa memnuniyet ve mutluluğu temsil eder.",
  },
  "Ten of Cups": {
    name_tr: "On Kupa",
    meaning_up_tr: "aile mutluluğu, uyum, duygusal tatmin",
    meaning_rev_tr: "aile çatışması, değer çatışması, kopukluk",
    desc_tr: "On Kupa aile mutluluğu ve uyumu temsil eder.",
  },
  "Page of Cups": {
    name_tr: "Kupalar Prensi",
    meaning_up_tr: "yaratıcılık, sezgi, duygusal mesaj, sanat",
    meaning_rev_tr: "duygusal dengesizlik, yaratıcılık eksikliği",
    desc_tr: "Kupalar Prensi yaratıcılık ve sezgiyi temsil eder.",
  },
  "Knight of Cups": {
    name_tr: "Kupalar Şövalyesi",
    meaning_up_tr: "romantizm, charme, sanat, duygusal arayış",
    meaning_rev_tr: "ruh hali değişkenliği, gerçekçi olmama",
    desc_tr: "Kupalar Şövalyesi romantizm ve charme'ı temsil eder.",
  },
  "Queen of Cups": {
    name_tr: "Kupalar Kraliçesi",
    meaning_up_tr: "empati, sezgi, duygusal zeka, şefkat",
    meaning_rev_tr: "duygusal dengesizlik, bağımlılık, manipülasyon",
    desc_tr: "Kupalar Kraliçesi empati ve sezgiyi temsil eder.",
  },
  "King of Cups": {
    name_tr: "Kupalar Kralı",
    meaning_up_tr: "duygusal denge, şefkat, diplomasi, bilgelik",
    meaning_rev_tr: "duygusal manipülasyon, ruh hali değişkenliği",
    desc_tr: "Kupalar Kralı duygusal denge ve bilgeliği temsil eder.",
  },

  // Kılıçlar
  "Ace of Swords": {
    name_tr: "Kılıçlar Ası",
    meaning_up_tr: "yeni fikirler, netlik, gerçek, zihinsel güç",
    meaning_rev_tr: "karışıklık, zihinsel blokaj, yanlış bilgi",
    desc_tr: "Kılıçlar Ası yeni fikirler ve zihinsel netliği temsil eder.",
  },
  "Two of Swords": {
    name_tr: "İki Kılıç",
    meaning_up_tr: "kararsızlık, denge, zor seçim, çıkmaz",
    meaning_rev_tr: "karar verme, netlik, çözüm",
    desc_tr: "İki Kılıç kararsızlık ve zor seçimleri temsil eder.",
  },
  "Three of Swords": {
    name_tr: "Üç Kılıç",
    meaning_up_tr: "kalp kırıklığı, acı, yas, ayrılık",
    meaning_rev_tr: "iyileşme, affetme, acıdan kurtulma",
    desc_tr: "Üç Kılıç kalp kırıklığı ve acıyı temsil eder.",
  },
  "Four of Swords": {
    name_tr: "Dört Kılıç",
    meaning_up_tr: "dinlenme, meditasyon, iyileşme, barış",
    meaning_rev_tr: "huzursuzluk, uykusuzluk, stres",
    desc_tr: "Dört Kılıç dinlenme ve iyileşmeyi temsil eder.",
  },
  "Five of Swords": {
    name_tr: "Beş Kılıç",
    meaning_up_tr: "çatışma, yenilgi, haksızlık, ego",
    meaning_rev_tr: "barış yapma, affetme, ders alma",
    desc_tr: "Beş Kılıç çatışma ve yenilgiyi temsil eder.",
  },
  "Six of Swords": {
    name_tr: "Altı Kılıç",
    meaning_up_tr: "geçiş, seyahat, iyileşme, rehberlik",
    meaning_rev_tr: "takılıp kalma, direniş, geçmişe bağlılık",
    desc_tr: "Altı Kılıç geçiş ve iyileşmeyi temsil eder.",
  },
  "Seven of Swords": {
    name_tr: "Yedi Kılıç",
    meaning_up_tr: "aldatma, hırsızlık, strateji, kaçış",
    meaning_rev_tr: "dürüstlük, suçluluk, yakalanma",
    desc_tr: "Yedi Kılıç aldatma ve stratejiyi temsil eder.",
  },
  "Eight of Swords": {
    name_tr: "Sekiz Kılıç",
    meaning_up_tr: "kısıtlama, korku, zihinsel hapishane",
    meaning_rev_tr: "özgürleşme, güçlenme, korkuları aşma",
    desc_tr: "Sekiz Kılıç kısıtlama ve korkuları temsil eder.",
  },
  "Nine of Swords": {
    name_tr: "Dokuz Kılıç",
    meaning_up_tr: "kaygı, korku, kabus, endişe",
    meaning_rev_tr: "iyileşme, umut, korkuları aşma",
    desc_tr: "Dokuz Kılıç kaygı ve korkuları temsil eder.",
  },
  "Ten of Swords": {
    name_tr: "On Kılıç",
    meaning_up_tr: "son, yenilgi, ihanet, çöküş",
    meaning_rev_tr: "iyileşme, yeniden başlama, umut",
    desc_tr: "On Kılıç son ve yenilgiyi temsil eder.",
  },
  "Page of Swords": {
    name_tr: "Kılıçlar Prensi",
    meaning_up_tr: "merak, öğrenme, haber, zihinsel enerji",
    meaning_rev_tr: "dedikodu, kötü haber, zihinsel karışıklık",
    desc_tr: "Kılıçlar Prensi merak ve öğrenmeyi temsil eder.",
  },
  "Knight of Swords": {
    name_tr: "Kılıçlar Şövalyesi",
    meaning_up_tr: "hız, kararlılık, cesaret, dürtüsellik",
    meaning_rev_tr: "düşüncesizlik, saldırganlık, sabırsızlık",
    desc_tr: "Kılıçlar Şövalyesi hız ve kararlılığı temsil eder.",
  },
  "Queen of Swords": {
    name_tr: "Kılıçlar Kraliçesi",
    meaning_up_tr: "zeka, bağımsızlık, netlik, objektiflik",
    meaning_rev_tr: "soğukluk, acımasızlık, kıskançlık",
    desc_tr: "Kılıçlar Kraliçesi zeka ve bağımsızlığı temsil eder.",
  },
  "King of Swords": {
    name_tr: "Kılıçlar Kralı",
    meaning_up_tr: "otorite, zeka, adalet, liderlik",
    meaning_rev_tr: "zorbalık, manipülasyon, kötü yargı",
    desc_tr: "Kılıçlar Kralı otorite ve zekayı temsil eder.",
  },

  // Pentagramlar
  "Ace of Pentacles": {
    name_tr: "Pentagramlar Ası",
    meaning_up_tr: "yeni fırsat, bolluk, maddi başlangıç, potansiyel",
    meaning_rev_tr: "kaçırılan fırsat, maddi kayıp, plansızlık",
    desc_tr: "Pentagramlar Ası yeni maddi fırsatları temsil eder.",
  },
  "Two of Pentacles": {
    name_tr: "İki Pentagram",
    meaning_up_tr: "denge, çok görevlilik, esneklik, değişim",
    meaning_rev_tr: "dengesizlik, stres, öncelik karmaşası",
    desc_tr: "İki Pentagram denge ve esnekliği temsil eder.",
  },
  "Three of Pentacles": {
    name_tr: "Üç Pentagram",
    meaning_up_tr: "işbirliği, takım çalışması, beceri, öğrenme",
    meaning_rev_tr: "çatışma, beceri eksikliği, işbirliği sorunu",
    desc_tr: "Üç Pentagram işbirliği ve beceriyi temsil eder.",
  },
  "Four of Pentacles": {
    name_tr: "Dört Pentagram",
    meaning_up_tr: "güvenlik, kontrol, cimrilik, koruma",
    meaning_rev_tr: "cömertlik, risk alma, kontrol kaybı",
    desc_tr: "Dört Pentagram güvenlik ve kontrolü temsil eder.",
  },
  "Five of Pentacles": {
    name_tr: "Beş Pentagram",
    meaning_up_tr: "yoksulluk, dışlanma, maddi kayıp, zorluk",
    meaning_rev_tr: "iyileşme, yardım, maddi düzelme",
    desc_tr: "Beş Pentagram maddi zorlukları temsil eder.",
  },
  "Six of Pentacles": {
    name_tr: "Altı Pentagram",
    meaning_up_tr: "cömertlik, paylaşım, yardım, denge",
    meaning_rev_tr: "bencillik, borç, dengesizlik",
    desc_tr: "Altı Pentagram cömertlik ve paylaşımı temsil eder.",
  },
  "Seven of Pentacles": {
    name_tr: "Yedi Pentagram",
    meaning_up_tr: "sabır, değerlendirme, yatırım, bekleme",
    meaning_rev_tr: "sabırsızlık, kötü yatırım, hayal kırıklığı",
    desc_tr: "Yedi Pentagram sabır ve değerlendirmeyi temsil eder.",
  },
  "Eight of Pentacles": {
    name_tr: "Sekiz Pentagram",
    meaning_up_tr: "ustalık, çalışkanlık, beceri geliştirme",
    meaning_rev_tr: "tembellik, beceri eksikliği, kalitesizlik",
    desc_tr: "Sekiz Pentagram ustalık ve çalışkanlığı temsil eder.",
  },
  "Nine of Pentacles": {
    name_tr: "Dokuz Pentagram",
    meaning_up_tr: "bağımsızlık, lüks, başarı, tatmin",
    meaning_rev_tr: "maddi sorunlar, bağımlılık, tatminsizlik",
    desc_tr: "Dokuz Pentagram bağımsızlık ve lüksü temsil eder.",
  },
  "Ten of Pentacles": {
    name_tr: "On Pentagram",
    meaning_up_tr: "aile serveti, miras, güvenlik, gelenek",
    meaning_rev_tr: "maddi kayıp, aile çatışması, istikrarsızlık",
    desc_tr: "On Pentagram aile serveti ve güvenliği temsil eder.",
  },
  "Page of Pentacles": {
    name_tr: "Pentagramlar Prensi",
    meaning_up_tr: "öğrenme, yeni proje, pratiklik, çalışkanlık",
    meaning_rev_tr: "tembellik, plansızlık, odaklanma eksikliği",
    desc_tr: "Pentagramlar Prensi öğrenme ve pratikliği temsil eder.",
  },
  "Knight of Pentacles": {
    name_tr: "Pentagramlar Şövalyesi",
    meaning_up_tr: "çalışkanlık, güvenilirlik, sabır, kararlılık",
    meaning_rev_tr: "tembellik, sıkıcılık, ilerleme eksikliği",
    desc_tr: "Pentagramlar Şövalyesi çalışkanlık ve güvenilirliği temsil eder.",
  },
  "Queen of Pentacles": {
    name_tr: "Pentagramlar Kraliçesi",
    meaning_up_tr: "besleyicilik, pratiklik, güvenlik, bolluk",
    meaning_rev_tr: "ihmal, maddi sorunlar, dengesizlik",
    desc_tr: "Pentagramlar Kraliçesi besleyicilik ve güvenliği temsil eder.",
  },
  "King of Pentacles": {
    name_tr: "Pentagramlar Kralı",
    meaning_up_tr: "maddi başarı, güvenlik, cömertlik, liderlik",
    meaning_rev_tr: "açgözlülük, maddi obsesyon, güvensizlik",
    desc_tr: "Pentagramlar Kralı maddi başarı ve güvenliği temsil eder.",
  },

  // Fallback değerler - API'den gelen İngilizce kartlar için
  default: {
    name_tr: "Bilinmeyen Kart",
    meaning_up_tr: "pozitif enerji, yeni fırsatlar, gelişim",
    meaning_rev_tr: "dikkat edilmesi gereken konular, iç gözlem",
    desc_tr: "Bu kart size özel bir mesaj taşıyor. Sezgilerinizi dinleyin.",
    suit_tr: "Mistik",
  },
}

// Türkçe fallback fonksiyonu
const getTurkishTranslation = (card: any) => {
  const translation = TURKISH_TRANSLATIONS[card.name] || TURKISH_TRANSLATIONS.default
  const suitTranslation = card.suit ? TURKISH_TRANSLATIONS[card.suit] : {}

  return {
    ...card,
    name_tr: translation.name_tr || card.name || "Bilinmeyen Kart",
    meaning_up_tr: translation.meaning_up_tr || "pozitif enerji, yeni başlangıçlar",
    meaning_rev_tr: translation.meaning_rev_tr || "dikkat, iç gözlem gerekli",
    desc_tr: translation.desc_tr || "Bu kart size özel bir mesaj getiriyor.",
    suit_tr: suitTranslation.suit_tr || card.suit || "Mistik",
  }
}

export default function TamamenTurkceTagotOyunu() {
  const [deck, setDeck] = useState<TarotCard[]>([])
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedCard, setSelectedCard] = useState<DrawnCard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTarotDeck()
  }, [])

  const fetchTarotDeck = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("https://tarotapi.dev/api/v1/cards")

      if (!response.ok) {
        throw new Error("Sunucu bağlantısı başarısız")
      }

      const data = await response.json()

      if (!data.cards || !Array.isArray(data.cards)) {
        throw new Error("Sunucudan geçersiz veri alındı")
      }

      // Tüm kartları Türkçe'ye çevir
      const enrichedCards = data.cards.map((card: any) => getTurkishTranslation(card))

      setDeck(enrichedCards)
      console.log("Tarot destesi başarıyla yüklendi:", enrichedCards.length, "kart")
    } catch (error) {
      console.error("Tarot destesi yüklenirken hata oluştu:", error)
      setError("Kartlar yüklenirken bir sorun oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  const getCardImageUrl = (card: TarotCard) => {
    const baseUrl = "https://sacred-texts.com/tarot/pkt/img"
    const cardCode = card.name_short.toLowerCase()
    return `${baseUrl}/${cardCode}.jpg`
  }

  const drawCards = async () => {
    if (deck.length === 0) return

    setIsDrawing(true)
    setDrawnCards([])
    setSelectedCard(null)
    setCurrentCardIndex(0)

    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1200))

      const randomIndex = Math.floor(Math.random() * deck.length)
      const card = deck[randomIndex]
      const reversed = Math.random() < 0.25

      const drawnCard: DrawnCard = {
        ...card,
        id: `${card.name}-${Date.now()}-${i}`,
        reversed,
        position: i,
        image_url: getCardImageUrl(card),
      }

      setDrawnCards((prev) => [...prev, drawnCard])
    }

    setIsDrawing(false)
  }

  const resetSpread = () => {
    setDrawnCards([])
    setSelectedCard(null)
    setCurrentCardIndex(0)
  }

  const getSpreadInterpretation = () => {
    if (drawnCards.length !== 3) return ""

    const themes = drawnCards.map((card) => {
      const meaning = card.reversed ? card.meaning_rev_tr : card.meaning_up_tr
      return meaning.split(",")[0].trim().toLowerCase()
    })

    const interpretations = [
      `Kartlarınız, geçmişte yaşadığınız ${themes[0]} deneyiminden, şu anki ${themes[1]} durumunuza ve gelecekte sizi bekleyen ${themes[2]} enerjisine doğru bir yolculuk gösteriyor.`,
      `Bu açılım, ${themes[0]} olan geçmişinizden ${themes[1]} olan şimdiki zamanınıza, oradan da ${themes[2]} olan geleceğinize doğru bir dönüşüm sürecini işaret ediyor.`,
      `Ruhsal yolculuğunuzda geçmişteki ${themes[0]} deneyimi, bugünkü ${themes[1]} durumunuzu şekillendirmiş ve gelecekte ${themes[2]} bir dönem sizi bekliyor.`,
      `Evrensel enerjiler size ${themes[0]} geçmişinizden ${themes[1]} bugününüze, ${themes[2]} geleceğinize uzanan bir hikaye anlatıyor.`,
      `Mistik kartlar ${themes[0]} olan dününüzden ${themes[1]} olan bugününüze, ${themes[2]} olan yarınınıza doğru bir enerji akışı gösteriyor.`,
      `Tarot'un bilgeliği ${themes[0]} geçmişinizin ${themes[1]} şimdiki zamanınızı nasıl etkilediğini ve ${themes[2]} geleceğinizi nasıl şekillendireceğini açıklıyor.`,
    ]

    return interpretations[Math.floor(Math.random() * interpretations.length)]
  }

  const scrollToCard = (index: number) => {
    setCurrentCardIndex(index)
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.scrollWidth / drawnCards.length
      scrollContainerRef.current.scrollTo({
        left: cardWidth * index,
        behavior: "smooth",
      })
    }
  }

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left" && currentCardIndex < drawnCards.length - 1) {
      scrollToCard(currentCardIndex + 1)
    } else if (direction === "right" && currentCardIndex > 0) {
      scrollToCard(currentCardIndex - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center text-white space-y-4 max-w-sm">
          <div className="relative">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-yellow-400" />
            <Star className="w-6 h-6 absolute -top-1 -right-1 animate-pulse text-purple-300" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
            Mistik Tarot Kartları Hazırlanıyor...
          </h2>
          <p className="text-purple-200 text-sm">Evrensel enerjiler toplanıyor</p>
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center text-white space-y-4 max-w-sm">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400">Bağlantı Sorunu</h2>
          <p className="text-purple-200 text-sm">{error}</p>
          <Button
            onClick={fetchTarotDeck}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-3"
            aria-label="Kartları tekrar yüklemeyi dene"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Tekrar Dene
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Mobil Başlık */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Moon className="w-8 h-8 text-purple-300" aria-hidden="true" />
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Mistik Tarot
            </h1>
            <Sun className="w-8 h-8 text-yellow-400" aria-hidden="true" />
          </div>
          <p className="text-purple-200 text-lg">Otantik Tarot kartlarıyla ruhsal rehberlik</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Star className="w-3 h-3 text-yellow-400" aria-hidden="true" />
            <span className="text-xs text-purple-300">Gerçek kartlar • Mistik yorumlar • Ruhsal kehanet</span>
            <Star className="w-3 h-3 text-yellow-400" aria-hidden="true" />
          </div>
        </div>

        {/* Ana İçerik */}
        <div className="max-w-lg mx-auto">
          {drawnCards.length === 0 ? (
            /* Başlangıç Durumu - Mobil Optimize */
            <div className="text-center">
              <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center justify-center gap-2 text-xl">
                    <Sparkles className="w-5 h-5 text-yellow-400" aria-hidden="true" />
                    Üç Kart Açılımı
                    <Sparkles className="w-5 h-5 text-yellow-400" aria-hidden="true" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-36 mx-auto bg-gradient-to-br from-purple-800 to-indigo-900 rounded-lg border-2 border-yellow-400/50 flex items-center justify-center shadow-lg">
                      <div className="text-center">
                        <Moon className="w-8 h-8 mx-auto mb-1 text-yellow-400" aria-hidden="true" />
                        <p className="text-xs text-purple-200">Mistik Kartlar</p>
                        <p className="text-xs text-purple-300">{deck.length} kart hazır</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-purple-200 leading-relaxed text-sm">
                      Geçmişinizi, şimdiki zamanınızı ve geleceğinizi keşfetmek için üç mistik tarot kartı çekin.
                      Sorunuza odaklanın ve evrenin size rehberlik etmesine izin verin.
                    </p>
                    <div className="flex items-center justify-center gap-3 text-sm text-purple-300">
                      <span>🕰️ Geçmiş</span>
                      <span>⭐ Şimdi</span>
                      <span>🔮 Gelecek</span>
                    </div>
                  </div>

                  <Button
                    onClick={drawCards}
                    disabled={isDrawing}
                    className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-lg py-6 shadow-lg touch-manipulation"
                    aria-label="Üç tarot kartı çek"
                  >
                    {isDrawing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                        Kartlar Çekiliyor... ({drawnCards.length}/3)
                      </>
                    ) : (
                      <>
                        <Shuffle className="w-5 h-5 mr-2" aria-hidden="true" />
                        Mistik Kartları Çek
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Kartlar Çekildi Durumu - Mobil Optimize */
            <div className="space-y-6">
              {/* Mobil Eylem Butonları */}
              <div className="flex gap-3">
                <Button
                  onClick={drawCards}
                  variant="outline"
                  className="flex-1 border-purple-400 text-purple-200 hover:bg-purple-500/20 bg-black/20 backdrop-blur-sm py-3 touch-manipulation"
                  disabled={isDrawing}
                  aria-label="Yeni tarot okuması başlat"
                >
                  <Shuffle className="w-4 h-4 mr-2" aria-hidden="true" />
                  Yeni Okuma
                </Button>
                <Button
                  onClick={resetSpread}
                  variant="outline"
                  className="flex-1 border-purple-400 text-purple-200 hover:bg-purple-500/20 bg-black/20 backdrop-blur-sm py-3 touch-manipulation"
                  aria-label="Mevcut kartları temizle"
                >
                  <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Temizle
                </Button>
              </div>

              {/* Mobil Kart Döngüsü */}
              <div className="space-y-4">
                {/* Kart Navigasyonu */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSwipe("right")}
                    disabled={currentCardIndex === 0}
                    className="text-purple-300 hover:text-white touch-manipulation"
                    aria-label="Önceki karta git"
                  >
                    <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                  </Button>

                  <div className="flex gap-2" role="tablist" aria-label="Kart navigasyonu">
                    {drawnCards.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => scrollToCard(index)}
                        className={`w-2 h-2 rounded-full transition-colors touch-manipulation ${
                          currentCardIndex === index ? "bg-purple-400" : "bg-purple-600/50"
                        }`}
                        role="tab"
                        aria-selected={currentCardIndex === index}
                        aria-label={`${index + 1}. karta git`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSwipe("left")}
                    disabled={currentCardIndex === drawnCards.length - 1}
                    className="text-purple-300 hover:text-white touch-manipulation"
                    aria-label="Sonraki karta git"
                  >
                    <ChevronRight className="w-5 h-5" aria-hidden="true" />
                  </Button>
                </div>

                {/* Kaydırılabilir Kartlar Konteyneri */}
                <div
                  ref={scrollContainerRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  role="tabpanel"
                  aria-label="Çekilen tarot kartları"
                >
                  {drawnCards.map((card, index) => (
                    <div key={card.id} className="flex-shrink-0 w-full snap-center">
                      <div className="space-y-3">
                        {/* Pozisyon Bilgisi */}
                        <div className="text-center space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xl" aria-hidden="true">
                              {SPREAD_POSITIONS[index].icon}
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1"
                            >
                              {SPREAD_POSITIONS[index].name}
                            </Badge>
                          </div>
                          <p className="text-sm text-purple-200 leading-relaxed">
                            {SPREAD_POSITIONS[index].description}
                          </p>
                        </div>

                        {/* Kart */}
                        <Card
                          className={`bg-black/40 border-purple-500/50 backdrop-blur-sm cursor-pointer transition-all duration-500 hover:border-purple-400 hover:shadow-xl touch-manipulation ${
                            selectedCard?.id === card.id ? "ring-2 ring-purple-400 shadow-xl" : ""
                          }`}
                          onClick={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}
                          role="button"
                          tabIndex={0}
                          aria-label={`${card.name_tr} kartı - detayları görmek için tıklayın`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setSelectedCard(selectedCard?.id === card.id ? null : card)
                            }
                          }}
                        >
                          <CardContent className="p-4">
                            {/* Sadece görsel için ters pozisyon */}
                            <div className="relative w-32 h-48 mx-auto mb-3 rounded-lg overflow-hidden shadow-lg border-2 border-yellow-400/30">
                              <Image
                                src={card.image_url || "/placeholder.svg"}
                                alt={`${card.name_tr} tarot kartı ${card.reversed ? "(ters pozisyon)" : ""}`}
                                fill
                                className={`object-cover transition-transform duration-700 ${card.reversed ? "transform rotate-180" : ""}`}
                                sizes="(max-width: 768px) 50vw, 33vw"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = `/placeholder.svg?height=300&width=200&text=${encodeURIComponent(card.name_tr)}`
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              <div className="absolute bottom-1 left-1 right-1 text-center">
                                <div className="bg-black/70 rounded p-1 backdrop-blur-sm">
                                  <div className="text-yellow-400 font-bold text-xs">{card.value}</div>
                                  {card.suit_tr && <div className="text-white text-xs">{card.suit_tr}</div>}
                                </div>
                              </div>
                            </div>

                            {/* Metin kısmı her zaman normal pozisyonda */}
                            <div className="text-center space-y-2">
                              <h3 className="font-bold text-white text-base">{card.name_tr}</h3>
                              {card.reversed && (
                                <Badge variant="destructive" className="text-xs bg-red-600/80">
                                  Ters Pozisyon
                                </Badge>
                              )}
                              <p className="text-sm text-purple-200 leading-relaxed">
                                {card.reversed ? card.meaning_rev_tr : card.meaning_up_tr}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobil Kart Detayları */}
              {selectedCard && (
                <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm shadow-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                      <Sparkles className="w-5 h-5 text-yellow-400" aria-hidden="true" />
                      {selectedCard.name_tr} {selectedCard.reversed && "(Ters)"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4" aria-hidden="true" />
                        Kart Açıklaması
                      </h4>
                      <p className="text-purple-100 leading-relaxed text-sm">{selectedCard.desc_tr}</p>
                    </div>

                    <Separator className="bg-purple-500/30" />

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-green-400 flex items-center gap-2 text-sm">
                          <Sun className="w-4 h-4" aria-hidden="true" />
                          Düz Pozisyon Anlamı
                        </h4>
                        <p className="text-purple-100 text-sm leading-relaxed bg-green-900/20 p-3 rounded-lg border border-green-500/30">
                          {selectedCard.meaning_up_tr}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-red-400 flex items-center gap-2 text-sm">
                          <Moon className="w-4 h-4" aria-hidden="true" />
                          Ters Pozisyon Anlamı
                        </h4>
                        <p className="text-purple-100 text-sm leading-relaxed bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                          {selectedCard.meaning_rev_tr}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mobil Açılım Yorumu */}
              {drawnCards.length === 3 && (
                <Card className="bg-black/40 border-purple-500/50 backdrop-blur-sm shadow-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                      <span className="text-xl" aria-hidden="true">
                        🔮
                      </span>
                      <span>Genel Yorum</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-4 rounded-lg border border-purple-400/30">
                      <p className="text-purple-100 leading-relaxed text-sm font-medium">{getSpreadInterpretation()}</p>
                    </div>
                    <div className="text-center text-xs text-purple-300 italic">
                      Bu yorum, otantik tarot kartlarının mistik enerjisine dayanmaktadır. Kendi sezgilerinizi de
                      dinlemeyi unutmayın.
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
