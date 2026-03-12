import Image from "next/image";
import SubpageHeader from "@/app/components/SubpageHeader";
import SubpageSidebar from "@/app/components/SubpageSidebar";

export const metadata = { title: "다애다문화학교 | 다애교회" };

const R2 = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev/service/multicultural";

export default function MulticulturalPage() {
  return (
    <>
      <SubpageHeader
        title="봉사와 선교"
        breadcrumbs={[
          { label: "봉사와 선교", href: "/service/prayer" },
          { label: "다애다문화학교", href: "/service/multicultural" },
        ]}
      />

      <div className="mx-auto flex max-w-5xl gap-10 px-4 pt-6 pb-20 md:px-8">
        <SubpageSidebar
          title="봉사와 선교"
          items={[
            { label: "중보기도", href: "/service/prayer", group: "봉사" },
            { label: "다애다문화학교", href: "/service/multicultural", group: "봉사" },
            { label: "에즈마이야", href: "/service/ezemiah", group: "봉사" },
            { label: "숨바선교", href: "/mission/sumba", group: "선교" },
            { label: "국내선교", href: "/mission/domestic", group: "선교" },
            { label: "해외선교", href: "/mission/overseas", group: "선교" },
          ]}
        />
        <div className="min-w-0 flex-1">
        {/* 제목 */}
        <h2 className="text-xl font-bold text-navy md:text-2xl">
          다애다문화학교
        </h2>
        <div className="mt-2 h-1 w-12 rounded-full bg-accent" />

        {/* 성경구절 */}
        <div className="mt-6 rounded-2xl bg-neutral-50 p-6">
          <p className="text-center text-[19px] leading-relaxed italic text-navy/70">
            너희의 하나님 여호와는 신 가운데 신이시며 주 가운데 주시요 크고 능하시며 두려우신 하나님이시라 사람을 외모로 보지 아니하시며 뇌물을 받지 아니하시고 고아와 과부를 위하여 정의를 행하시며 나그네를 사랑하여 그에게 떡과 옷을 주시나니 너희는 나그네를 사랑하라 전에 너희도 애굽 땅에서 나그네 되었음이니라
          </p>
          <p className="mt-2 text-center text-sm text-accent">— 신명기 10:17~19</p>
        </div>

        {/* 홈페이지 바로가기 */}
        <div className="mt-6 flex justify-center">
          <a
            href="http://www.allloveschool.or.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm transition hover:shadow-md"
          >
            <Image
              src={`${R2}/logo.png`}
              alt="All Love School 다애다문화학교"
              width={160}
              height={48}
              className="h-10 w-auto"
            />
            <span className="text-sm font-medium text-navy">홈페이지 바로가기 →</span>
          </a>
        </div>

        {/* Vimeo 영상 + 안내 */}
        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="relative aspect-video">
            <iframe
              src="https://player.vimeo.com/video/86358008"
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="다애다문화학교 사역보고"
            />
          </div>
          <div className="px-5 py-4">
            <p className="text-[13px] leading-relaxed text-neutral-500">
              2014년 2월 9일 이희용 교장 선생님(다애다문화학교)께서 다애교회 주일설교 시간에 사역보고 해주신 영상입니다.
              다애다문화학교에 대한 가장 자세하고 진솔한 내용입니다.
            </p>
          </div>
        </div>

        {/* 1. 다문화 사회로 들어 선 한국 */}
        <div className="mt-10 space-y-4 text-[15px] leading-relaxed text-neutral-700 md:text-base">
          <h3 className="text-lg font-bold text-navy">
            1. 다문화 사회로 들어 선 한국
          </h3>
          <p>
            다애교회는 한국 땅에 이미 시작된 &ldquo;다문화 사회&rdquo;를 섬김으로서 복음적 국가를 세우는 사명을 감당하고 있습니다.
          </p>
          <p>
            &ldquo;다문화 사회&rdquo;의 형성은 국가의 출범과 관련한 역사적 배경에 따라 두 가지로 분류될 수 있습니다.
            첫째 유형, 우리나라의 경우와 비슷한 영국이나 독일 같은 나라들의 다문화 사회 발전의 유형. 이들 나라의 경우 비교적 동질적인 문화를 가졌던 전통적인 국민국가로 출범했으나, 자본과 노동의 세계화와 외국인 노동자의 유입, 또는 새로운 종교의 유입에 따라 다문화 사회로 진입한 것을 경험한 바 있습니다.
            둘째 유형, 캐나다나 미국처럼 처음부터 다양한 인종과 문화로 구성된 이민국가로 출발한 경우.
          </p>
          <p>
            우리나라는 첫째 유형과 가까운데, 비교적 동질적인 문화를 가진 전통적 국민국가 형태를 유지하다가, 이주민의 유입으로 다문화 사회로 이행을 경험하는 상황으로 볼 수 있습니다.
            우리나라의 경우 이민 역사가 짧고, 소수민족 공동체가 존재하지 않으며, 단독이민의 형태가 많은 등 독일의 &lsquo;손님노동자(guest worker)&rsquo; 모델에 가깝습니다.
            즉, 이민족과 충분한 접촉 경험이 없는 상태에서 이주민의 유입을 경험하게 되는 상황인 것입니다.
          </p>
          <p>
            다문화의 경험이 충분하지 않은 상황에서 이주민의 단기간 거주만 허용하는 경우 이주민에 대한 법적·제도적 차별과 주변화가 심할 수 있으며, 이주민의 다양한 욕구와 특성에 대한 이해와 민감한 반응도 부족할 수 있습니다.
            이는 성별, 나이, 계층, 교육, 소득 수준에 따라 위계화가 심하고, 사회적 약자에 대한 배려도 취약한 한국사회의 특성과도 연관된다고 할 수 있습니다.
          </p>
          <p>
            다문화 현상은 서로 다른 인종과 문화, 집단이 만나고, 교류하고, 부딪치고, 갈등을 겪고, 극복하는 과정에서 나타나는 자연스러운 현상입니다.
            하지만 이에 따른 충돌, 갈등, 불평등의 문제도 함께 나타나게 됩니다.
            특히, 이주민을 능동적인 우리사회의 &lsquo;주체&rsquo;가 아닌 수동적인 &lsquo;객체&rsquo; 또는 &lsquo;대상&rsquo;으로 도구화하는 것은 다문화 사회 갈등의 원인이 됩니다.
            이주민을 열등하거나, 이국적으로, 또는 특별대우의 대상으로 간주할 것이 아니라 또 다른 &lsquo;우리&rsquo;로 보고, 동등한 시각으로 함께하는 것이 필요합니다.
          </p>
          <p className="text-sm text-neutral-500">
            (네이버, 다문화 커뮤니케이션, 2012, 커뮤니케이션북스)
          </p>
        </div>

        {/* 2. 왜, 교회가 한국의 다문화 사회를 섬겨야 하는가? */}
        <div className="mt-10 space-y-4 text-[15px] leading-relaxed text-neutral-700 md:text-base">
          <h3 className="text-lg font-bold text-navy">
            2. 왜, 교회가 한국의 다문화 사회를 섬겨야 하는가?
          </h3>

          <div className="space-y-2">
            <p className="font-medium text-neutral-800">유럽의 다문화주의 정책 실패 발언</p>
            <ul className="space-y-1 pl-4 text-sm text-neutral-600">
              <li>2010년 10월, 앙겔라 메르켈 독일 총리 — &ldquo;다른 문화가 공존하는 독일식 다문화주의는 실패했다.&rdquo;</li>
              <li>2011년 2월, 데이비드 캐머런 영국 총리 — &ldquo;서로 다른 문화가 독립해서 공존하는 영국식의 다문화주의는 영국의 가치 안에서 발전하지 못했다.&rdquo;</li>
              <li>2011년 2월, 니콜라 사르코지 프랑스 대통령 — &ldquo;프랑스에서 다문화주의 정책은 실패했다.&rdquo; &ldquo;우리는 그 동안 우리나라에 이주하는 사람들의 정체성에 대해 신경을 썼지만, 정작 이들을 받아들이는 우리들의 정체성에 대해서 충분히 고민하지 않았다.&rdquo;</li>
            </ul>
          </div>

          <p>
            유럽의 독일, 영국, 프랑스의 수장들은 모두 다문화 정책이 실패하였다고 선언하였습니다.
            독일의 다문화 정책은 동화주의, 소위 Melting pot(용광로)입니다. 독일은 이주민들이 기독교인이 되지 않더라도, 기독교적 정신을 갖고, 기독교적 공동체를 이루고자 하였습니다.
            그러나 이것에 동의하지 않는 여러 민족의 사람들이 살게 되면서 다문화 사회로 가는데 실패한 것입니다.
            영국의 다문화 정책은 공동체 주의, 소위 Salad bowl(샐러드 접시)입니다. 그러나 런던지하철 사건 이후 이 또한 실패라고 선언합니다.
          </p>
          <p>
            그럼에도 다문화 정책이 실패했다고 하는 유럽의 나라들은 모두가 바라볼 수 있는 깃발, 가치가 있었습니다.
            예를 들어 프랑스는 혁명 이후 모든 국민이 &lsquo;자유, 평등, 연합&rsquo;의 가치를 공유하였고, 그것을 최고의 가치로 받아들였습니다.
            독일은 &lsquo;기독교&rsquo;, 영국은 &lsquo;화합&rsquo;이 그 깃발이었습니다.
            유럽의 나라들은 나라마다 함께 바라볼 수 있는 깃발이 있었습니다. 그럼에도 불구하고 다문화 사회를 이루는 데 실패하였습니다.
          </p>
          <p>
            한국은 이제 막 다문화 사회에 들어서는 첫 단계에 있습니다. 유럽의 나라와 같이 최고의 가치라고 내세울 수 있는 가치, 국민 모두가 공유하고 바라보는 깃발도 없습니다.
            이것은 한국의 다문화 사회도 실패할 것이라는 것을 말해줍니다. 깃발이 있어도 실패를 하는데, 깃발마저 없이 어떻게 성공할 수 있겠습니까?
          </p>
          <p>
            그렇다면 어차피 실패하기 때문에 아무 것도 하지 말아야 하는 걸까요?
            그렇지 않습니다. 그리스도인은 이 땅에 하나님의 나라가 이루어지도록 최선을 다 해야 합니다.
            물론 하나님의 나라는 이 땅에서 완성되지 않습니다. 예수님께서 재림 하시고 새 하늘과 새 땅이 펼쳐질 때 완성 됩니다.
            그런데 주님께서 다시 오실 때까지 우리와 우리 자녀들은 이 땅에서의 삶을 살아갑니다. 그리고 싫든 좋든 외국인이 옆집에서 살게 될 것입니다.
          </p>
          <p>
            그리스도인은 이 땅에 복음적 국가가 세워지도록, 다문화 사회를 품고, 다문화 사회를 섬겨야 할 책임이 있습니다.
            하나님께서 한국 땅에 수많은 교회를 먼저 세우신 후에 외국인을 보내어 다문화 사회를 만드시는 이유가 무엇일까요?
            교회가 그리스도의 사랑으로 나그네와 같은 외국인들, 도움이 없이는 생존 자체가 어려운 자들을 섬기는 것을, 사람들이 보고 하나님께로 돌아오게 하시기 위함은 아닐까요?
            다문화 사회를 이루는 것이 실패할 것을 알지만, 우리 교회가 이 땅의 작은 빛의 역할을 하여 그리스도의 사랑을 전하고 복음을 전하기 위해 우리는 다문화 사회를 섬기고 있습니다.
          </p>
        </div>

        {/* 3. 다니엘과 에스더를 꿈꾸며... */}
        <div className="mt-10 space-y-4 text-[15px] leading-relaxed text-neutral-700 md:text-base">
          <h3 className="text-lg font-bold text-navy">
            3. 다니엘과 에스더를 꿈꾸며...
          </h3>
          <p>
            &lsquo;다애&rsquo;라는 말은 다니엘의 &lsquo;다&rsquo;와 에스더의 &lsquo;에&rsquo;를 합친 합성어입니다.
            다애교회의 목적 중 하나는 그들처럼 이 땅은 물론 전 세계에 영향력 있는 하나님의 사람들을 키우는 것입니다.
            이와 같이 다문화 자녀들이 다애다문화학교를 통하여 다니엘과 에스더와 같은 하나님의 사람들이 되길 꿈꿉니다.
          </p>
          <p>
            또한 다애교회의 중점 사역인 에즈마이야(Ezemiah) 운동이 있습니다. 이 단어는 에스라와 느헤미야를 합성하여 만든 것입니다.
            이들이 조국으로 돌아와 신앙을 개혁하고 나라를 재건하였던 것처럼, 다애다문화학교를 통하여 다니엘과 에스더처럼 자란 하나님의 사람들이 에스라와 느헤미야처럼 자신들의 조국을 일으키는 운동이 일어나기를 꿈꿉니다.
          </p>
        </div>
      </div>
      </div>
    </>
  );
}
