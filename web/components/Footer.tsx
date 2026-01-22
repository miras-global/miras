import Link from "next/link";

export default function Footer(){
  return (
    <footer>
      <div className="container">© {new Date().getFullYear()} <Link href="https://miras.global">miras.global</Link> <Link href="https://app.aragon.org/dao/ethereum-mainnet/mrs.dao.eth" target="_blank">DAO</Link> • Patent Pending 63/914,518 • <Link href="/blog">Blog</Link> {/*• <Link href="/exchange">MRS exchange</Link> • <Link href="https://app.aragon.org/dao/ethereum-mainnet/mrs.dao.eth" target="_blank">Governance</Link> */}• <Link href="/whitepapers/1.3/miras.pdf">Whitepaper</Link> • <Link href="/miras_investor_presentation.pdf">Investors</Link>{/* <Link href="https://miras.global/roadmap">Roadmap</Link> <Link href="https://miras.global/audit">Audit</Link> */} • <Link href="/tos">TOS</Link> • <Link href="https://github.com/miras-global/miras">Source Code</Link></div>
    </footer>
  );
}
