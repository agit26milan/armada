# Trans

Dashboard kecil untuk memantau armada MBTA (Boston). Isinya satu halaman: daftar kendaraan yang sedang beroperasi, filter rute dan trip, pagination, dan modal detail per kendaraan lengkap dengan peta.

Data diambil langsung dari API publik MBTA v3 (`https://api-v3.mbta.com`). Tidak perlu API key, tapi butuh koneksi internet.

## Yang perlu disiapkan

- Node.js **20.19+** atau **22.12+** (Vite 8 tidak jalan di Node 18). Cek dengan `node -v`.
- npm (repo ini memakai `package-lock.json`, jadi npm paling aman).
- Akses jaringan ke `api-v3.mbta.com` dan `tile.openstreetmap.org`.

## Cara install

1. Ambil kode dan masuk ke foldernya.

   ```bash
   git clone <url-repo-ini>
   cd trans
   ```

2. Install dependency.

   ```bash
   npm install
   ```

3. Siapkan file environment. Salin contoh yang sudah ada, jangan dibuat manual supaya nama variabelnya tidak salah.

   ```bash
   cp .env.example .env
   ```

   Isinya cuma satu baris:

   ```
   VITE_API_BASE_URL=https://api-v3.mbta.com
   ```

   Kalau variabel ini kosong, aplikasi tetap jalan tapi memakai nilai default yang sama (`https://api-v3.mbta.com`).

4. Jalankan dev server.

   ```bash
   npm run dev
   ```

5. Buka `http://localhost:5173`. Halaman pertama otomatis mengarah ke `/?page=0&pageSize=12`.

Kalau `.env` baru diubah, hentikan dev server lalu jalankan ulang. Vite hanya membaca `VITE_*` saat start, bukan saat file berubah.

## Perintah yang ada

| Perintah | Fungsinya |
| --- | --- |
| `npm run dev` | Dev server dengan hot reload |
| `npm run build` | Type check (`tsc -b`) lalu build ke `dist/` |
| `npm run preview` | Menyajikan hasil build untuk dicek lokal |
| `npm run lint` | Lint seluruh repo dengan Oxlint |

Kalau mau memastikan tidak ada error sebelum commit, jalankan `npx tsc -b && npm run lint`.

## Arsitektur

Repo ini memakai pola feature-based: satu folder berisi semua kebutuhan satu fitur, lalu ada folder `shared` untuk hal yang dipakai lintas fitur. Saat ini baru ada satu fitur, yaitu `armada`, dan hanya satu halaman di rute `/`.

### Struktur folder

```
src/
├── main.tsx                    # entry point: bikin query client + router, render AppProviders
├── routeTree.gen.ts            # generated oleh TanStack Router, jangan diedit manual
│
├── app/                        # infrastruktur aplikasi, bukan fitur
│   ├── layouts/root-layout.tsx # kerangka halaman (navbar + slot konten)
│   ├── providers/
│   │   ├── app-providers.tsx   # QueryClientProvider + RouterProvider + devtools (dev only)
│   │   └── query-client.ts     # default option react-query: staleTime, retry, dll
│   ├── router/
│   │   ├── create-router.ts    # instance router
│   │   └── types.ts            # tipe router context (queryClient)
│   └── styles/global.css       # import Tailwind, token warna, dark mode
│
├── routes/                     # file-based routing
│   ├── __root.tsx              # root route: layout, halaman 404, error boundary
│   └── index.tsx               # rute "/" sekaligus validasi search param
│
├── features/
│   └── armada/
│       ├── index.ts            # pintu keluar fitur: export ArmadaPage
│       ├── page/index.tsx      # halaman: filter bar, grid kartu, pagination, state modal
│       ├── components/         # kartu kendaraan, modal detail, loading, kosong, error
│       ├── api/
│       │   ├── armada.api.ts      # fungsi fetch mentah ke endpoint MBTA
│       │   └── armada.queries.ts  # query key + queryOptions react-query
│       ├── lib/
│       │   ├── vehicle-view.ts    # format angka, label status, warna, jam
│       │   └── map-projection.ts  # hitungan Web Mercator untuk peta
│       └── types/armada.ts     # tipe respons API (Vehicle, Route, Trip, Stop)
│
└── shared/                     # dipakai fitur mana pun
    ├── api/http-client.ts      # fetch wrapper: base URL, query string, ApiError
    ├── components/
    │   ├── icons.tsx
    │   └── ui/                 # button, dropdown, modal, pagination, navbar, empty, error
    ├── hooks/                  # use-dark-mode (zustand + localStorage), use-pagination
    └── lib/                    # cn(), env, formatNumber
```

### Alur data

Semuanya satu arah: URL jadi sumber state, layer query yang bicara ke API, komponen cuma menampilkan.

1. `src/routes/index.tsx` mendefinisikan `validateSearch`. Semua filter dan pagination disimpan di query string: `?page=0&pageSize=12&route=111,112&trip=123`. Nilai yang tidak valid dibuang dan diganti default, jadi URL hasil edit manual tidak bisa merusak halaman.
2. `ArmadaPage` membaca nilai itu lewat `useSearch`, lalu memanggil `vehiclesQueryOptions(...)`. Setiap perubahan filter atau halaman memakai `navigate()` dengan patch sebagian, bukan membuat state lokal sendiri. Efeknya, tombol back/forward browser dan reload tetap membawa kondisi yang sama, plus URL bisa dibagikan.
3. `armada.api.ts` menerjemahkan tipe query jadi parameter MBTA (`filter[route]`, `page[limit]`, dan seterusnya) dan mengirim lewat `httpRequest`. Semua error non-2xx dilempar sebagai `ApiError` yang membawa status.
4. `armada.queries.ts` mendefinisikan query key berjenjang (`vehicleKeys.list(query)`, `vehicleKeys.detail(id)`). Ini yang membuat cache tidak tertukar antara daftar dan detail, serta otomatis refetch saat filter berubah.
5. `ArmadaPage` menggabungkan data kendaraan dengan data rute dan halte (`routesQueryOptions`, `stopsQueryOptions`) memakai `Map` per id, lalu mengoper hasilnya ke `ArmadaCard`.
6. Klik kartu membuka `ArmadaModal` berisi `vehicleId`. Modal itu memanggil `/vehicles/{id}` plus rute, stop, dan trip terkait, lalu menampilkan skeleton selama data belum datang.

Data yang butuh parameter besar (daftar rute dan trip di filter) memakai `useInfiniteQuery` supaya dropdown bisa memuat bertahap, bukan menarik ratusan baris di awal.

### Beberapa keputusan yang perlu diketahui

- **Modal responsif.** `shared/components/ui/modal.tsx` mendeteksi lebar layar. Di bawah 640px tampil sebagai bottom sheet (bisa ditarik ke bawah untuk menutup), di atasnya jadi dialog biasa. Semua modal sebaiknya memakai komponen ini, bukan bikin sendiri.
- **Peta tanpa library.** `lib/map-projection.ts` menghitung sendiri konversi lat/long ke pixel (Web Mercator) dan tile OSM yang perlu dimuat. Alasannya supaya tidak menambah dependency peta hanya untuk satu preview. Akibatnya, kalau nanti butuh garis rute asli atau clustering marker, lebih masuk akal pindah ke library seperti Leaflet atau MapLibre.
- **Styling.** Tailwind v4 dengan token warna di `@theme` dalam `global.css` (`bg-surface`, `text-ink-muted`, `border-line`, dan seterusnya). Hindari warna hex langsung di komponen supaya dark mode tetap konsisten. Dark mode diaktifkan lewat class `dark` di `<html>` dan disimpan di localStorage lewat zustand.
- **Status dan label.** Semua penerjemahan kode API jadi teks yang enak dibaca ada di `lib/vehicle-view.ts` (`STOPPED_AT`, `IN_TRANSIT_TO`, `MANY_SEATS_AVAILABLE`, dan lainnya). Kalau perlu label baru, tambahkan di sana, jangan di komponen.
- **Error handling.** Halaman punya tiga kondisi terpisah: `ArmadaLoading` (grid skeleton), `ArmadaEmpty` (data kosong), dan `ArmadaError` (request gagal, ada tombol coba lagi). Modal juga punya state skeleton dan error sendiri karena datanya diambil terpisah.

### Menambah fitur baru

Buat folder `src/features/<nama>` dengan isi minimal `page/`, `components/`, `api/`, `types/`, dan `index.ts` sebagai pintu keluar. Tambahkan rute di `src/routes/` dan, kalau perlu data server, buat `*.queries.ts` berisi query key plus `queryOptions` seperti di `armada.queries.ts`. Komponen yang dipakai lebih dari satu fitur naik ke `shared/`.

## Hal yang sering bikin bingung

- Endpoint `/vehicles/{id}` mengembalikan **satu objek** (`{ data: {...} }`), sedangkan `/vehicles` mengembalikan array. Karena itu ada dua tipe berbeda, `VehicleDetailResponse` dan `VehicleListResponse`.
- Jumlah total halaman tidak dikirim langsung oleh API. Pagination menebaknya dari link `links.last` (`page[offset]` terakhir), lihat `usePagination` di `shared/hooks`.
- Filter `trip` disimpan sebagai string berkoma di URL, lalu dipecah lagi jadi array. Ini sengaja supaya format URL tetap sederhana.
- Tile OSM dipakai untuk kebutuhan demo. Untuk produksi dengan trafik tinggi, ganti `getTileUrl()` di `lib/map-projection.ts` ke penyedia tile berbayar, karena kebijakan pemakaian OSM membatasi trafik berat.
- `routeTree.gen.ts` dihasilkan plugin TanStack Router saat dev/build. Kalau isinya aneh setelah menambah file rute, jalankan ulang dev server.
