const DB = {
  series: [
    {
      id: 's1',
      title: 'Mini: The Journey',
      searchTags: 'mini, the journey, orman',
      desc: 'Karanlık bir ormanda yalnız yürüyen Mini, gizemli bir ışığın peşine düşer. Bu destansı yolculuk onu ormanın kalbindeki büyük sırrı keşfetmeye götürecektir.',
      poster: 'assets/img/mini.jpg.png',
      trailer: 'bolum1.mp4',
      year: '2026',
      match: '98%',
      meta: '4K HDR',
      episodes: [
        {
          id: 's1e1',
          epNum: 1,
          title: 'Karanlık Ormana Giriş',
          desc: 'Mini karanlık ormanda yürür. Uzakta gizemli bir ışık görür ve peşine düşer.',
          file: 'bolum1.mp4',
          isYoutube: false,
          subs: [
            {from:0,to:5,text:'Mini karanlık ormanda yürür.'},
            {from:5,to:10,text:'Uzakta küçük bir ışık görür.'},
            {from:10,to:15,text:'Ay ışığı yüzüne vurur.'}
          ]
        },
        {
          id: 's1e2',
          epNum: 2,
          title: 'Işığın Gizemi',
          desc: 'Işığın gizemi derinleşir. Mini ormanın kalbindeki büyük kütüphaneye ulaşır.',
          file: 'bolum2.mp4',
          isYoutube: false,
          subs: [
            {from:0,to:6,text:'Mini ışığın peşinden ormana ilerler.'},
            {from:6,to:11,text:'Mini elini uzatır. Işık ona doğru gelir.'}
          ]
        }
      ]
    }
  ],
  movies: [
    {
      id: 'm1',
      title: 'Hoplayanlar',
      searchTags: 'hoppers, hoplayanlar, disney, pixar, animasyon',
      desc: 'Eşsiz bir animasyon macerası. Disney ve Pixar\'ın en yeni başyapıtı.',
      poster: 'assets/img/hoplayanlar.jpg',
      trailer: 'https://archive.org/embed/hoplayanlar-izle-2026',
      file: 'https://archive.org/embed/hoplayanlar-izle-2026',
      isYoutube: true,
      year: '2026',
      match: '95%',
      meta: 'HD'
    },
    {
      id: 'm2',
      title: 'Zootopia Serisi',
      searchTags: 'zootopia 2, zootropolis, hayvanlar şehri, judy hopps, nick wilde, tavşan, polis, animasyon',
      desc: 'Zootropolis şehrinin maceraları tek bir yerde. Judy Hopps ve Nick Wilde ile efsanevi yolculuk (iOS Klasörü).',
      poster: 'assets/img/zootopiaanaafiş.jpg',
      isCollection: true,
      year: 'Koleksiyon',
      match: '99%',
      meta: '2 Film',
      collection: [
        {
          id: 'm2f1',
          epNum: 1,
          title: 'Zootropolis: Hayvanlar Şehri (2016)',
          desc: 'Judy Hopps polis akademisinden mezun olup Zootropolis\'e gelir. Nick Wilde ile unutulmaz bir macera başlar.',
          poster: 'assets/img/zootopia1.jpg',
          file: 'https://archive.org/embed/zootropolis-hayvanlar-sehri-izle-hdfilmcehennemi-film-izle-hd-film-izle',
          isYoutube: true
        },
        {
          id: 'm2f2',
          epNum: 2,
          title: 'Zootopia 2 (2025)',
          desc: 'Judy ve Nick\'in yeni macerası. Çok yakında SiomJourney\'de!',
          poster: 'assets/img/zootopia2.jpg',
          file: 'https://drive.google.com/file/d/1rT79Rg0BovQU-P6kHHN48uc3T9tBzTAB/view?usp=sharing',
          isYoutube: true
        }
      ]
    },
    {
      id: 'm3',
      title: 'Coco (Koko)',
      searchTags: 'coco, koko, miguel, ölüler diyarı, pixar, animasyon, müzikal',
      desc: '12 yaşındaki Miguel\'in Ölüler Diyarı\'ndaki unutulmaz müzikal yolculuğu.',
      poster: 'assets/img/coco.jpg.jpg',
      year: '2017',
      match: '97%',
      meta: '4K Ultra HD',
      file: '',
      isYoutube: false
    },
    {
      id: 'm4',
      title: 'Ejderhanı Nasıl Eğitirsin Serisi',
      searchTags: 'ejderhanı nasıl eğitirsin, how to train your dragon, htyd, dişsiz, toothless, hıçkıdık, hiccup, ejderha, animasyon',
      desc: 'Hıçkıdık ve Dişsiz\'in Berk adasındaki efsanevi dostluk hikayesi (iOS Klasörü).',
      poster: 'assets/img/ejderhanınasıleğitirsinanaafiş.jpg',
      isCollection: true,
      year: '2010-2019',
      match: '99%',
      meta: 'Koleksiyon',
      collection: [
        {
          id: 'm4f1',
          epNum: 1,
          title: 'Ejderhanı Nasıl Eğitirsin 1',
          desc: 'Genç bir Viking olan Hıçkıdık ve yaralı bir ejderhanın dostluğu.',
          poster: 'assets/img/ejderhanınasıleğitirsin1.jpg',
          file: '',
          isYoutube: false
        },
        {
          id: 'm4f2',
          epNum: 2,
          title: 'Ejderhanı Nasıl Eğitirsin 2',
          desc: 'Hıçkıdık ve Dişsiz yeni dünyalar keşfederken büyük bir tehditle karşılaşır.',
          poster: 'assets/img/ejderhanınasıleğitirsin2.jpg',
          file: '',
          isYoutube: false
        },
        {
          id: 'm4f3',
          epNum: 3,
          title: 'Ejderhanı Nasıl Eğitirsin 3: Gizli Dünya',
          desc: 'Hıçkıdık ejderha ütopyasını ararken, Dişsiz kendi türünden birini bulur.',
          poster: 'assets/img/ejderhanınasıleğitirsin3.jpg',
          file: '',
          isYoutube: false
        }
      ]
    }
  ]
};
