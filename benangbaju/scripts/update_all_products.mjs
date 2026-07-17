import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => line.split('=').map(part => part.trim()))
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY 


const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const careCotton = 'Perawatan:\n- Cuci menggunakan mesin atau tangan\n- Gunakan deterjen lembut, jangan gunakan pemutih\n- Jemur di tempat teduh\n- Setrika dengan suhu sedang'
const careDelicate = 'Perawatan:\n- Disarankan cuci manual dengan tangan agar tekstur/lipatan tetap awet\n- Jangan diperas terlalu kencang\n- Khusus plisket (pleats), JANGAN disetrika pada bagian lipatannya\n- Gunakan steamer bila perlu'
const careAccessory = 'Perawatan:\n- Cuci lembut menggunakan tangan\n- Jangan disikat keras\n- Keringkan dengan diangin-anginkan\n- Setrika suhu rendah jika perlu'

const productContents = {
  'Blots Obi Belt': {
    short_description: 'Obi belt bahan katun jepang untuk mempermanis OOTD.',
    description: 'Blots Obi Belt by Benangbaju\n\nBahan: 100% Katun Jepang\nUkuran: Lingkar pinggang +- 70cm\n\nObi belt cantik yang cocok di-mix and match dengan dress atau kemeja polos. Bahan katun jepang berkualitas, tebal namun tetap nyaman dipakai seharian tanpa bikin gerah.',
    care_guide: careAccessory,
    meta_title: 'Jual Blots Obi Belt Katun Jepang | Benangbaju',
    meta_description: 'Beli Blots Obi Belt Original dari Benangbaju. Aksesori ikat pinggang wanita bahan katun jepang untuk tampilan elegan.'
  },
  'Daily Shirt Pastel': {
    short_description: 'Kemeja katun polos wanita warna pastel casual.',
    description: 'Daily Shirt Pastel by Benangbaju\n\nBahan: Katun Premium\nKemeja basic wanita dengan pilihan warna pastel yang fresh. Potongan loose fit nyaman banget buat ngampus, kerja, atau sekadar hangout santai.\n\nDetail:\n- Full kancing aktif (busui friendly)\n- Lengan panjang wudhu friendly\n- Cuttingan bikin look makin rapi',
    care_guide: careCotton,
    meta_title: 'Jual Daily Shirt Pastel Kemeja Wanita | Benangbaju',
    meta_description: 'Beli Daily Shirt Pastel Benangbaju. Kemeja polos wanita casual dengan warna pastel yang lembut, nyaman dipakai ngantor atau kuliah.'
  },
  'Daily Shirt Earth Tone': {
    short_description: 'Kemeja basic wanita warna earth tone (cewek bumi).',
    description: 'Daily Shirt Earth Tone Series by Benangbaju\n\nBahan: Katun Poplin (100% Katun)\nPilihan Warna: Oat, Clay, Taupe, Cocoa, Espresso\n\nKemeja wanita dengan desain basic, timeless, dan minimalis. Warna-warna earth tone super kalem, gampang banget di mix & match buat daily wear. Menyerap keringat dengan sangat baik.',
    care_guide: careCotton,
    meta_title: 'Jual Daily Shirt Earth Tone Series | Benangbaju',
    meta_description: 'Kemeja Daily Shirt Earth Tone Series by Benangbaju. Kemeja wanita warna oat, clay, taupe yang cocok untuk outfit cewek bumi.'
  },
  'Minimalist Pants': {
    short_description: 'Celana kulot wanita highwaist panjang casual.',
    description: 'Minimalist Pants by Benangbaju\n\nModel: Celana Kulot High Waist\n\nCelana panjang potongan lurus (straight fit) yang clean and simple. Bikin efek kaki lebih panjang dan jenjang saat dipakai. Ada kantong aktif di sisi kiri dan kanan. Cocok banget buat outfit ke kantor atau hangout casual.',
    care_guide: careCotton,
    meta_title: 'Jual Minimalist Pants Celana Kulot High Waist | Benangbaju',
    meta_description: 'Beli Minimalist Pants Benangbaju. Celana kulot wanita high waist panjang, anti lecek, bikin look kaki makin jenjang.'
  },
  'Wavy Reversible Blouse': {
    short_description: 'Blouse 2in1 kerah wavy bisa dipakai bolak-balik.',
    description: 'Wavy Reversible Blouse by Benangbaju\n\nBlouse unik dengan desain 2in1 yang bisa dipakai bolak-balik (depan-belakang). Punya aksen kerah wavy (bergelombang) khas Korean style yang bikin look makin cute dan stand out. Bahan lembut, jatuh dan adem seharian.',
    care_guide: careDelicate,
    meta_title: 'Jual Wavy Reversible Blouse Korean Style | Benangbaju',
    meta_description: 'Wavy Reversible Blouse dari Benangbaju. Atasan wanita 2in1 bisa dipakai bolak-balik, detail kerah wavy unik ala Korea.'
  },
  'Raia Cheongsam Shirt': {
    short_description: 'Kemeja wanita kerah shanghai (Mandarin collar) elegan.',
    description: 'Raia Cheongsam Shirt by Benangbaju\n\nKemeja berkerah shanghai (Mandarin collar) yang elegan dan rapi. Cocok banget buat kamu yang mau tampil beda saat ngantor atau acara semi-formal. Kancing depan eksklusif, bahannya adem dipakai meski cuaca lagi panas.',
    care_guide: careCotton,
    meta_title: 'Jual Raia Cheongsam Shirt Kemeja Shanghai | Benangbaju',
    meta_description: 'Beli Raia Cheongsam Shirt Benangbaju. Kemeja wanita kerah shanghai elegan, cocok untuk ke kantor maupun acara kasual.'
  },
  'Blows Skirt': {
    short_description: 'Rok bawahan panjang model A-line yang flowy.',
    description: 'Blows Skirt by Benangbaju\n\nRok bawahan panjang model A-line yang bikin look makin anggun dan feminin. Karet pinggang di bagian belakang bikin rok ini super elastis dan menyesuaikan lingkar pinggang kamu.\n\nDetail:\n- Cutting A-line bikin kaki terlihat proporsional\n- Bahan flowy, tidak nerawang dan nyaman dilangkah',
    care_guide: careDelicate,
    meta_title: 'Jual Blows Skirt Rok Panjang A-line | Benangbaju',
    meta_description: 'Dapatkan Blows Skirt terbaru Benangbaju. Rok bawahan panjang model A-line wanita, bahan flowy dan jatuh dengan karet pinggang nyaman.'
  },
  'Stripes On Shirt': {
    short_description: 'Kemeja motif garis vertikal wanita adem.',
    description: 'Stripes On Shirt by Benangbaju\n\nKemeja motif garis vertikal andalan buat ngasih efek tubuh keliatan lebih ramping dan proporsional. Bahan katun yang adem dan menyerap keringat. Cuttingan agak oversized nyaman banget dipakai jadi kemeja biasa atau dijadiin outer.',
    care_guide: careCotton,
    meta_title: 'Jual Stripes On Shirt Kemeja Garis Wanita | Benangbaju',
    meta_description: 'Beli Stripes On Shirt Benangbaju. Kemeja motif garis vertikal wanita dengan cuttingan nyaman untuk OOTD sehari-hari.'
  },
  'Poppin Basic Blouse': {
    short_description: 'Blouse polos basic bahan flowy anti gerah.',
    description: 'Poppin Basic Blouse by Benangbaju\n\nBlouse polos tanpa kerah (round neck) andalan buat kamu yang suka tampil simple. Bahannya super jatuh (flowy), anti gerah, dan lengannya didesain longgar biar leluasa gerak. Kunci OOTD simple tapi rapi.',
    care_guide: careCotton,
    meta_title: 'Jual Poppin Basic Blouse Wanita Polos | Benangbaju',
    meta_description: 'Poppin Basic Blouse dari Benangbaju. Atasan blouse polos lengan panjang bahan jatuh, sangat adem dan nyaman dipakai.'
  },
  'Hooke Reversible Vest': {
    short_description: 'Rompi wanita 2in1 bolak-balik dengan detail pengait hooke.',
    description: 'Hooke Reversible Vest by Benangbaju\n\nRompi (vest) trendi yang didesain 2in1! Bisa dipakai bolak-balik beda sisi buat ganti gaya. Ada detail pengait (hooke) di bagian depan yang bikin penampilannya artsy abis. Cocok banget buat layering kemeja polos kamu.',
    care_guide: careDelicate,
    meta_title: 'Jual Hooke Reversible Vest Rompi Wanita | Benangbaju',
    meta_description: 'Belanja Hooke Reversible Vest Benangbaju. Rompi wanita 2in1 bolak-balik dengan aksen pengait unik untuk outer kemeja.'
  },
  'Poppin Blouse': {
    short_description: 'Blouse casual chic untuk andalan daily wear.',
    description: 'Poppin Blouse by Benangbaju\n\nKoleksi blouse manis buat OOTD kamu. Punya cuttingan pas yang nyaman dipakai bergerak, bahannya tebal tapi gak nerawang, gampang banget di-mix & match buat acara kasual, ke kampus, atau sekadar jalan-jalan santai.',
    care_guide: careCotton,
    meta_title: 'Jual Poppin Blouse Wanita Kekinian | Benangbaju',
    meta_description: 'Jual Poppin Blouse dari Benangbaju. Atasan casual wanita dengan bahan premium yang nyaman dipakai untuk hangout.'
  },
  'Knotie Reversible Blouse-Shirt': {
    short_description: 'Atasan 2in1 kemeja blouse detail ikat knot.',
    description: 'Knotie Reversible Blouse-Shirt by Benangbaju\n\nBaju inovatif yang multifungsi! Bisa dipakai bergaya blouse maupun kemeja. Ada aksen tali ikat (knot) yang manis, plus desainnya bisa di-styling bolak-balik sesuai selera kamu. Bikin outfit kamu gak pernah ngebosenin.',
    care_guide: careDelicate,
    meta_title: 'Jual Knotie Reversible Blouse-Shirt | Benangbaju',
    meta_description: 'Knotie Reversible Blouse-Shirt by Benangbaju. Atasan wanita 2in1 dengan aksen ikat knot cantik yang bisa dibolak-balik.'
  },
  'Pleats 2in1 Blouse-Shirt': {
    short_description: 'Atasan kemeja kombinasi plisket (pleats) belakang.',
    description: 'Pleats 2in1 Blouse-Shirt by Benangbaju\n\nPerpaduan sempurna antara siluet kemeja rapi dengan aksen plisket (pleats) di bagian tertentu. Bisa dipakai full kancing seperti kemeja formal, atau di-styling loose. Lipatan plisketnya awet dan bikin tampilan beda dari yang lain.',
    care_guide: careDelicate,
    meta_title: 'Jual Pleats 2in1 Blouse-Shirt Plisket | Benangbaju',
    meta_description: 'Beli Pleats 2in1 Blouse-Shirt Benangbaju. Kemeja wanita dengan kombinasi tekstur plisket yang unik dan kekinian.'
  },
  'Textura Two-Ways Blouse': {
    short_description: 'Blouse bertekstur premium 2 gaya pemakaian.',
    description: 'Textura Two-Ways Blouse by Benangbaju\n\nBlouse dari bahan bertekstur unik yang ngasih kesan mewah tanpa perlu disetrika ribet. Desain two-ways, ngasih kebebasan buat styling casual maupun formal. Kainnya jatuh, adem, dan gampang banget perawatannya.',
    care_guide: careDelicate,
    meta_title: 'Jual Textura Two-Ways Blouse Wanita | Benangbaju',
    meta_description: 'Textura Two-Ways Blouse Benangbaju. Blouse bahan bertekstur anti lecek yang nyaman untuk ootd daily.'
  },
  'Dotte Shirt': {
    short_description: 'Kemeja crop boxy dengan tekstur dot timbul.',
    description: 'Dotte Shirt by Benangbaju\n\nKemeja cutting boxy (agak crop tapi panjang pas) dengan bahan tekstur bintik (dot) timbul. Memberi kesan vintage chic yang playful. Full kancing aktif di depan, cakep banget dipakai langsung atau dijadiin outer.',
    care_guide: careDelicate,
    meta_title: 'Jual Dotte Shirt Kemeja Boxy Bertekstur | Benangbaju',
    meta_description: 'Dotte Shirt by Benangbaju. Kemeja wanita potongan boxy dengan detail bahan bertekstur dot yang unik dan stylish.'
  },
  'Daily Shirt Neutral': {
    short_description: 'Kemeja basic warna netral (hitam, putih, abu).',
    description: 'Daily Shirt Neutral Series by Benangbaju\n\nPilihan ter-aman buat lemari kapsul kamu! Kemeja warna netral yang gampang banget dipadupadankan dengan bawahan apapun. Cuttingan loose, bahan sejuk menyerap keringat, cocok banget dipakai buat ngantor atau aktivitas seharian.',
    care_guide: careCotton,
    meta_title: 'Jual Daily Shirt Neutral Series | Benangbaju',
    meta_description: 'Daily Shirt Neutral Benangbaju. Kemeja polos warna hitam, putih, dan abu yang wajib ada untuk gaya basic harian.'
  },
  'Hazy Shirt': {
    short_description: 'Kemeja casual bahan jatuh untuk gaya effortless.',
    description: 'Hazy Shirt by Benangbaju\n\nKemeja santai dengan bahan yang ringan dan super jatuh di badan. Sangat cocok buat outfit liburan atau nongkrong santai. Cuttingannya longgar, anti sesak, ngasih kesan gaya effortless tapi tetep keren.',
    care_guide: careCotton,
    meta_title: 'Jual Hazy Shirt Kemeja Kasual Wanita | Benangbaju',
    meta_description: 'Hazy Shirt dari Benangbaju. Kemeja kasual bahan jatuh dan ringan untuk OOTD hangout yang effortless.'
  },
  'Plain Shirt': {
    short_description: 'Kemeja polos klasik andalan para wanita.',
    description: 'Plain Shirt by Benangbaju\n\nKemeja polos klasik yang wajib ada di setiap lemari baju! Potongan standar yang fit, bisa dipakai rapi ngantor atau kuliah. Bahannya beneran adem, gak gampang lecek, dan pastinya jahitannya rapi sekelas butik.',
    care_guide: careCotton,
    meta_title: 'Jual Plain Shirt Kemeja Polos Klasik | Benangbaju',
    meta_description: 'Beli Plain Shirt Original Benangbaju. Kemeja polos wanita potongan klasik untuk ke kantor, kuliah, atau acara kasual.'
  },
  'Epiphany Shirt': {
    short_description: 'Kemeja statement gaya unik dan beda.',
    description: 'Epiphany Shirt by Benangbaju\n\nKemeja andalan kalau kamu lagi bosen gaya gitu-gitu aja. Desain eksklusif dengan detail asimetris/statement yang bikin OOTD langsung stand out. Dibuat dari bahan premium yang awet dan tebal pas.',
    care_guide: careDelicate,
    meta_title: 'Jual Epiphany Shirt Kemeja Unik | Benangbaju',
    meta_description: 'Epiphany Shirt by Benangbaju. Kemeja wanita desain statement dan unik untuk gaya fashion yang lebih berani.'
  }
}

// Fallback just in case
const defaultContent = (name) => {
  return {
    short_description: `Atasan ${name} original Benangbaju.`,
    description: `Produk ${name} by Benangbaju\n\nHadir dengan material pilihan yang nyaman dan adem. Desainnya gampang buat di-mix and match dengan outfit andalan kamu. Cocok untuk dipakai hangout maupun kasual.`,
    care_guide: careCotton,
    meta_title: `Jual ${name} Asli | Benangbaju`,
    meta_description: `Beli ${name} original dari Benangbaju. Produk fashion wanita dengan bahan sejuk dan desain terkini.`
  }
}

async function main() {
  const { data: products, error } = await supabase.from('products').select('id, name')
  if (error) {
    console.error('Error fetching products:', error)
    return
  }

  console.log(`Found ${products.length} products to update with plain text Shopee style.`)

  for (const product of products) {
    const custom = productContents[product.name] || defaultContent(product.name)

    const updated = {
      short_description: custom.short_description,
      description: custom.description,
      care_guide: custom.care_guide,
      meta_title: custom.meta_title,
      meta_description: custom.meta_description,
    }

    const { error: updateError } = await supabase
      .from('products')
      .update(updated)
      .eq('id', product.id)
    
    if (updateError) {
      console.error(`Failed to update ${product.name}:`, updateError)
    } else {
      console.log(`Updated plain text: ${product.name}`)
    }
  }
}

main()
