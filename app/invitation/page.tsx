import type { Metadata } from "next";
import Image from "next/image";

const images = [
  "http://alllovechurch.org/data/editor/2602/thumb-4bc6532af74f99a72c9850e140427e0f_1771991956_146_1440x2037.jpg",
  "http://alllovechurch.org/data/editor/2602/thumb-4bc6532af74f99a72c9850e140427e0f_1771991956_5539_1440x2037.jpg",
  "http://alllovechurch.org/data/editor/2602/thumb-4bc6532af74f99a72c9850e140427e0f_1771991956_9902_1440x2037.jpg",
  "http://alllovechurch.org/data/editor/2602/thumb-4bc6532af74f99a72c9850e140427e0f_1771991957_3885_1440x2037.jpg",
];

export const metadata: Metadata = {
  title: "주민초청연주회 | 새봄을 바라봄 | 26년 3월 7일(토) 오후5시",
  openGraph: {
    title: "주민초청연주회 | 새봄을 바라봄 | 26년 3월 7일(토) 오후5시",
    images: [{ url: images[0] }],
  },
};

export default function InvitationPage() {
  return (
    <div className="bg-white">
      {images.map((src, i) => (
        <Image
          key={i}
          src={src}
          alt={`초대장 ${i + 1}`}
          width={1440}
          height={2037}
          sizes="100vw"
          className="w-full h-auto block"
          priority={i === 0}
        />
      ))}
    </div>
  );
}
