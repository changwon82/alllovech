import R2Manager from "./R2Manager";

export default function R2Page() {
  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-800">
        R2 파일 관리
        <div className="mt-1 h-1 w-12 rounded-full bg-accent" />
      </h2>
      <div className="mt-6">
        <R2Manager />
      </div>
    </div>
  );
}
