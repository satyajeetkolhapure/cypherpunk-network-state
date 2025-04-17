import { FunctionComponent, useEffect, useState } from "react";
import { getCnsNetizens, Netizen } from "@/lib/cns/get-cns-netizens";
import { AccountCardShort } from "@/components/userprofile/account-card-short";
import { PageHeader } from "@/components/page-header";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export const AllNetizens: FunctionComponent = () => {
    const [netizens, setNetizens] = useState<Netizen[]>([]);

    useEffect(() => {
        getCnsNetizens().then((netizens) => {
            setNetizens(netizens);
            console.log(netizens.map((n) => n.address));
        });
    }, []);

    return (
        <div className="flex flex-col w-full h-[100dvh] p-8 text-white">
            <div className="flex-1 overflow-y-auto">
                <PageHeader title="All Netizens" />
                <div className="mt-8">
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                        <p className="text-gray-400 text-lg font-bold">
                            Explore the profiles of the CNS Netizens
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 max-w-screen-xl w-full mx-auto">
                        {netizens.map((netizen) => (
                            <AccountCardShort
                                key={netizen.address}
                                address={netizen.address}
                                profileType={netizen.profileType}
                                agentNature={netizen.agentNature}
                                showOnlyProfileType={true}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
