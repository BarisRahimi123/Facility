interface LogoProps {
  showBeta?: boolean;
}

export function Logo({ showBeta = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <h1 className="text-xl font-bold text-gray-900">
        <span className="font-outfit font-extrabold">
          Facility
          <span className="text-blue-600">Core</span>
        </span>
        {showBeta && (
          <span className="text-xs font-medium bg-blue-600 text-white px-2 py-0.5 rounded-full ml-2 font-outfit">
            BETA
          </span>
        )}
      </h1>
    </div>
  );
}
