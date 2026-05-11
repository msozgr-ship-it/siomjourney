const DB = {
  series: [
    {
      id: 's1',
      title: 'Mini: The Journey',
      desc: 'Karanlık bir ormanda yalnız yürüyen Mini, gizemli bir ışığın peşine düşer. Bu destansı yolculuk onu ormanın kalbindeki büyük sırrı keşfetmeye götürecektir.',
      poster: 'assets/posters/mini_poster.png',
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
      title: 'Hoplayanlar (Hoppers)',
      desc: 'Eşsiz bir animasyon macerası. Disney ve Pixar\'ın en yeni başyapıtı.',
      poster: 'https://upload.wikimedia.org/wikipedia/en/5/52/Hoppers_teaser_poster.jpg',
      trailer: 'https://drive.google.com/file/d/17UTHsOennIW1tT9dhK8d9K7pOOppMn9q/preview',
      file: 'https://drive.google.com/file/d/17UTHsOennIW1tT9dhK8d9K7pOOppMn9q/preview',
      isYoutube: true,
      year: '2026',
      match: '95%',
      meta: 'HD'
    }
  ]
};
