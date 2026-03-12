import Image from "next/image";
import SubpageHeader from "@/app/components/SubpageHeader";

export const metadata = { title: "인사말씀 | 다애교회" };

const R2 = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/site/about";

export default function AboutPage() {
  return (
    <>
      <SubpageHeader
        title="교회소개"
        breadcrumbs={[
          { label: "교회소개", href: "/about" },
          { label: "인사말씀" },
        ]}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 pb-20 md:px-8">
        {/* 기존 인사말씀 */}
        <h2 className="text-xl font-bold text-navy md:text-2xl">
          우리 다애교회를 찾아주셔서 감사합니다.
        </h2>
        <p className="mt-2 text-sm font-semibold text-neutral-600 md:text-base">
          다애교회는...
          <br />
          대한예수교장로회(합신) 동서울노회 소속 교회입니다.
        </p>

        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-neutral-700 md:text-base">
          <p>
            2008년 9월 28일 창립예배(강남YMCA)를 드리며 공식적으로 시작되었으며,
            다니엘과 에스더와 같은 하나님의 자녀들을 키우며, 하나님의 마음에 합한 교회로 쓰임 받기 원하는 교회입니다.
          </p>
          <p>
            창립 후, 하나님이 주신 사명을 따라 부모교사, 에즈마이야 사역, 다애다문화학교, 인도네시아 숨바선교 등
            여러 사역을 통해 이 땅에 하나님의 나라가 확장되는 일에 아끼지 않고 헌신하였습니다.
          </p>
          <p>
            그러던 중 하나님의 은혜로 내곡지구에 새예배당을 짓고 2023년 6월 입당하게 되었습니다.
            하나님께서 우리 다애교회에 아름다운 새예배당을 허락하신 이유와 뜻이 있다고 믿습니다.
            다애교회가 새예배당이 세워진 내곡지구에 복이 되는 교회가 되길 기도해 주시길 부탁드립니다.
          </p>
          <p className="font-medium text-neutral-800">
            감사합니다.
          </p>
        </div>

        {/* 구분선 */}
        <hr className="my-12 border-neutral-200" />

        {/* 편지 제목 */}
        <h2 className="text-xl font-bold leading-snug text-navy md:text-2xl">
          내곡동에 세워진 다애교회를 찾아주신 이웃들에게 드리는 편지
        </h2>

        {/* 사진 + 편지 본문 */}
        <div className="mt-6 text-[15px] leading-relaxed text-neutral-700 md:text-base">
          <div className="float-left mr-5 mb-4 w-40 overflow-hidden rounded-2xl md:w-52">
            <Image
              src={`${R2}/letter.jpg`}
              alt="내곡동 다애교회"
              width={208}
              height={280}
              className="h-auto w-full object-cover"
            />
          </div>
          <p>
            <b>&lsquo;다애교회&rsquo;</b>를 검색해 주셨군요, 감사합니다.
          </p>
          <p className="mt-4">
            공사현장이었는데~ 어느날 문득, 하얀색 교회당이 드러나면서{" "}
            <b>&lsquo;다애교회&rsquo;</b>라고 쓰여있으니까 웬지 속으로
            반가우셨던 분이 바로 당신일 것 같습니다.
          </p>
          <p className="mt-4">
            정말 반갑습니다. 어떤 교회인지 궁금하실 것 같아 이렇게 인사를
            드립니다.
          </p>
        </div>

        {/* 담임목사 소개 */}
        <div className="mt-10 space-y-4 text-[15px] leading-relaxed text-neutral-700 md:text-base">
          <h3 className="text-lg font-bold text-navy">
            저는 다애교회 담임목사 이순근입니다.
          </h3>
          <p>
            총신대학을 거쳐 합동신학대학원교(M.Div), 미국 Chicago 근교 트리니티
            신학교(Trinity Evangelical Divinity Seminary)에서
            교육학(Ph.D)을 전공했습니다.
          </p>
          <p>
            미국 유학 전까지는 수석부목사로 현 분당 소재 할렐루야교회를 섬겼고,
            유학 중에는 시카고 그레이스교회를 개척 목회했습니다.
          </p>
          <p>
            공부를 마친 후에는 할렐루야교회 원로 김상복 목사님께서
            목회하시던 볼티모어에 있는 벧엘교회를 7년 섬기다가 2008년 귀국하여
            합동신학대학교에서 목회학 교수로 재직했으며{" "}
            <b>&lsquo;다애교회&rsquo;</b>를 개척해서 오늘에 이르렀습니다.
          </p>
          <p>
            두 딸의 아빠인 가장이고요, 아내는 &lsquo;어?성경이
            읽어지네!&rsquo;, &lsquo;어?하버드에 들어가네!&rsquo; 등 많은
            저서를 저술한 이애실 사모입니다.
          </p>
        </div>

        {/* 다애 뜻 */}
        <div className="mt-10 space-y-4 text-[15px] leading-relaxed text-neutral-700 md:text-base">
          <h3 className="text-lg font-bold text-navy">
            &lsquo;다애?&rsquo; 뜻이 있어서 그렇게 이름지었습니다. 그리고
            그렇게 흘러왔습니다.
          </h3>
          <p>
            &lsquo;다니엘&rsquo;과 &lsquo;에스더&rsquo;의 다,에,에서
            따왔지요. 저는 나그네 미국생활 15년을 지나며 세계적인 인물로 커가는
            자녀들을 많이 봤습니다. 그런데 그렇게 되는 데는 길이 있습니다.
            교육입니다. 키워야 됩니다.
          </p>
          <p>
            한 두 아이라도 그런 아이들을 키우고 싶어 조국으로 돌아왔습니다.
            빚진 맘으로 시작했습니다. 이 초심은 나그네 한국생활을 하는
            다문화아이들을 위한 학교도 시작하게 했습니다.
            다애다문화학교입니다.
          </p>
          <p>
            3000명 벧엘교회를 사임했습니다. &ldquo;교회가 작아도 좋다, 다니엘
            에스더같은 한 두 아이라도 나와줘라!&rdquo; 이 깃발이 그렇게도
            좋아서 한국으로 돌아왔습니다. 건물이 아니라 교회의 존재
            의의였습니다. 건물은 안중에도 없었습니다. 강남 YMCA 3층을
            임대해서 쓰면서도 행복했습니다.
          </p>
          <p>그.런.데...</p>
          <p>
            YMCA가 건물을 매각해 버렸습니다. 뜻밖에 설 자리가 없어졌습니다.
            쫓겨나고 보니 갑자기 갈 곳이 없었습니다. 여기 저기 떠도는 중에
            여기 내곡동에 종교부지 한 필지를 보여주셨습니다. 건물 지을 생각은
            그렇게 1도 없었는데~ 현실적으로 불가능한데~ 그것도 코로나
            기간인데~
          </p>
          <div className="overflow-hidden rounded-2xl">
            <Image
              src={`${R2}/building.jpg`}
              alt="다애교회당 건축"
              width={800}
              height={450}
              className="h-auto w-full object-cover"
            />
          </div>
          <p>
            그.런.데... 결국 여기 이렇게 <b>다애교회당</b> 건물이
            세워졌습니다.
          </p>
        </div>

        {/* WHY? */}
        <div className="mt-10 space-y-4 text-[15px] leading-relaxed text-neutral-700 md:text-base">
          <h3 className="text-lg font-bold text-navy">
            WHY? 하필 왜 내곡동 이 자리에 교회당을 주셨나요?
          </h3>
          <p>
            담임목사로서 하나님께 대답을 받아야만 했습니다. 제가 받은 대답은
            이렇습니다. 확신이 있었습니다.
          </p>
        </div>

        {/* 1. 목회철학 */}
        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-neutral-700 md:text-base">
          <h3 className="text-lg font-bold text-navy">
            1. 네가 해 오던 목회철학 좋다, 그건 그대로 계속해라
          </h3>

          {/* 부모교사 */}
          <div className="space-y-3">
            <h4 className="font-bold text-neutral-800">1) 부모교사</h4>
            <p>
              다니엘, 에스더같은 아이들 키워내려면 먼저 부모가 선생님으로서
              실력이 있어야 한다고 생각했던 것, 그대로 계속해라. 그런 부모가
              되게 해 줘라.
            </p>
            <div className="overflow-hidden rounded-2xl">
              <Image
                src={`${R2}/parent-teacher.jpg`}
                alt="부모교사"
                width={800}
                height={450}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          {/* 다애다문화학교 */}
          <div className="space-y-3">
            <h4 className="font-bold text-neutral-800">
              2) 다애다문화학교
            </h4>
            <p>
              내 아이만 귀중하지 않다. 한국 이주노동자들의 자녀도 교육해라.
              10년동안 그래왔듯이 계속해서 학력인정 대안 중학교로 우뚝 서
              가라.
            </p>
            <div className="overflow-hidden rounded-2xl">
              <Image
                src={`${R2}/multicultural.jpg`}
                alt="다애다문화학교"
                width={800}
                height={450}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          {/* 숨바섬 선교 */}
          <div className="space-y-3">
            <h4 className="font-bold text-neutral-800">
              3) 숨바(Sumba)섬 선교
            </h4>
            <p>
              2014년부터 10년 동안 한 군데만 집중해서 선교해 온 섬 숨바! 그
              곳에 세워진 유치원, 초등학교도 3대에 걸쳐 개발시켜 나가라.
            </p>
            <div className="overflow-hidden rounded-2xl">
              <Image
                src={`${R2}/sumba.jpg`}
                alt="숨바섬 선교"
                width={800}
                height={450}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          {/* 에즈마이야 */}
          <div className="space-y-3">
            <h4 className="font-bold text-neutral-800">
              4) 에즈마이야(Ezemaiah)사역
            </h4>
            <p>
              2008년 설립 때부터 시작해서 섬겨온 농어촌교회 영어성경캠프도
              계속 이어가라. 성경전체를 창작 개발한 교재, 노래, 사역... 세계
              KIDS들도 사용할 수 있도록 계속 완성해 가라.
            </p>
            <div className="overflow-hidden rounded-2xl">
              <Image
                src={`${R2}/ezemiah.jpg`}
                alt="에즈마이야 사역"
                width={800}
                height={450}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 2. 내곡동 이웃 */}
        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-neutral-700 md:text-base">
          <h3 className="text-lg font-bold text-navy">
            2. 그러면서 이 내곡동 이웃들을 행복하게 해 드려라 HOW?
          </h3>

          <div className="space-y-3">
            <h4 className="font-bold text-neutral-800">
              1) VBS(Vacation Bible School)스타일의 교육
            </h4>
            <p>
              우선 아이들 교육에 중점을 둬라. &lsquo;어? 성경이
              읽어지네!&rsquo;로 성경만큼은 확실하게 다운로드 받을 수 있게
              교육하라. 지금까지 스킷드라마, 스테이션교육으로 아이들이
              맛있어하는 식탁테이블을 차려줘라. 영어, 중국어, 해 온대로
              성경암송으로 한 땀 한 땀 태산이 되게 하라. 해외유학 중인{" "}
              <b>다애</b>자녀들과도 네트워킹해서 진로를 이끌어주는 전인교육을
              시켜나가라.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-neutral-800">2) 중국어 예배</h4>
            <p>
              영어만으로는 경쟁력이 없다. 중국어 예배를 청년중심으로 드려라.
              중국 북경과 상해의 대표적인 교회를 20년이상 담임하셨던 박태윤,
              엄기영 목사님을 <b>다애교회</b>로 보내주지 않았는가? 이젠 중국
              본토가 아니다. 한국에 사는 중국유학생을 키워라. 중국서 살다
              돌아온 성도들, 목회자들도 함께 뭉쳐라. 한국에서 중국을 걷게
              하라. 내곡동 자녀들이, 청년들이 중국어권 영역으로도 들어갈 수
              있도록 글로벌 운동화를 발에 신겨주어라.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-neutral-800">
              3) 기도원같은 교회
            </h4>
            <p>
              &lsquo;기도원!&rsquo;, 사라진 언어다. 50년 전 부모들은
              기도원에서 부르짖지 않았는가? 그 기도로 오늘의 한류, K가 되지
              않았는가? 교회당 없이 사역해 온 <b>다애교회</b>가 이제는 건물이
              생겼으니 무엇보다 기도하는 곳이 되게 하라. 막다른 골목, 절벽에
              선 것 같이 힘들 때 언제든지 교회문은 열려있게 하라. 등교하는
              아이들도 잠깐 앉아서 기도하고 학교 가고싶게 하라. 기도할 줄
              아는 내곡동의 아이들! 평생 자산을 손에 쥐게 될 것이다.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-neutral-800">
              4) 그러면서도 카페같은 문화인교회
            </h4>
            <p>
              다애교회는 의사, 변호사, 기업인, 교수, 화가, 조각가, 사진작가,
              음악가, 등 예술가들이 많은 교회이지 않는가? 교양강좌, 레슨,
              취미생활,...뭐든 할 수 있다. 내곡동 아이들, 청소년, 어른들이
              문화로 춤추게 하라.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-neutral-800">
              5) 다애시니어아카데미(Senior Academy: 경로대학)
            </h4>
            <p>
              60대는 아직 젊다. 70대는 원숙하다. 어르신들의 경험 에너지를
              극대화 시켜라. 계속 교육받고, 계속 활동하고, 계속 봉사하시게
              하라. 어르신들이 평생 일구어 오신 그 보석같은 능력을
              Hybrid시켜라! 깜짝 놀랄 메뉴로 따끈한 점심식사 매주
              챙겨드리면서...
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-neutral-800">
              6) 이웃을 위한 정기연주회
            </h4>
            <p>
              본당에 Steinway피아노가 들어오지 않는가?! 하나님의 입당
              축하선물! 하나님의 안목! <b>다애</b> 음악가들은 이웃을 위해
              연주하라. 내곡동의 어린 음악가들이 음악 미래로 들어가도록 활짝
              문을 열어 드려라.
            </p>
          </div>
        </div>

        {/* 마무리 기도 */}
        <div className="mt-10 space-y-4 text-[15px] leading-relaxed text-neutral-700 md:text-base">
          <p>
            어쩌다보니 내곡동이었습니다. 저희가 찾은 게 아니라 하나님이
            찾아주셨습니다. 그래서 내곡동 이웃에게 찾아오게 된{" "}
            <b>다애교회!</b>
          </p>
          <p>
            아, 맞습니다! 어쩌다 찾아온 게 아니라 하나님의 인도 맞습니다!
            <br />
            그래서 지금 이 글을 읽으시는 당신을 만나면서 이렇게 기도하고
            싶습니다.
          </p>
          <div className="rounded-2xl bg-neutral-50 p-6 text-neutral-800">
            <p>
              <b>&ldquo;</b>주님.
              <br />
              저희 <b>다애교회</b>가 주님오실 때까지 대를 이어가며 예수를
              그리스도라고 전하는 순전한 복음의 교회 되게 하소서.
              <br />
              이 시대에 하나님의 마음에 합한 교회 되게 하소서.
              <br />
              하나님의 뜻을 알아서 100% 순종하는 교회 되게 하옵소서.
              <br />
              이 교회가 지금 이 글을 읽으신 분에게 복이 되게 하옵소서.
              <br />
              <b>다애교회가 내곡동의 행복이 되게 하소서!&rdquo;</b>
            </p>
          </div>
          <p className="text-right font-medium text-neutral-800">
            2023년 4월 부활절 즈음에...
            <br />- 이순근 목사
          </p>
        </div>
      </div>
    </>
  );
}
