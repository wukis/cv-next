import type { StaticImageData } from 'next/image'

import anwalt from '@/images/companies/anwalt.jpg'
import inlusion from '@/images/companies/inlusion.jpg'
import integrus from '@/images/companies/integrus.jpg'
import itlogas from '@/images/companies/itlogas.jpg'
import olympic from '@/images/companies/olympic.jpg'
import profectusNovus from '@/images/companies/profectus-novus.jpg'
import scayle from '@/images/companies/scayle.jpg'
import solutionlab from '@/images/companies/solutionlab.jpg'
import aleksandrSmailov from '@/images/recommendations/aleksandr-smailov.jpeg'
import alekseiGolda from '@/images/recommendations/aleksei-golda.jpeg'
import andreiLungu from '@/images/recommendations/andrei-lungu.jpeg'
import antoninaStoliarova from '@/images/recommendations/antonina-stoliarova.jpeg'
import arnoldasStarkauskas from '@/images/recommendations/arnoldas-starkauskas.jpeg'
import biancaDellaRosa from '@/images/recommendations/bianca-della-rosa.jpeg'
import danielMotzev from '@/images/recommendations/daniel-motzev.jpeg'
import dimitrijSkorobatov from '@/images/recommendations/dimitrij-skorobatov.jpeg'
import dmitrySergiets from '@/images/recommendations/dmitry-sergiets.jpeg'
import donatasMaikstenas from '@/images/recommendations/donatas-maikstenas.jpeg'
import eugeneBunin from '@/images/recommendations/eugene-bunin.jpeg'
import gintareKaubryte from '@/images/recommendations/gintare-kaubryte.jpeg'
import hansKreuger from '@/images/recommendations/hans-kreuger.jpeg'
import henrikasGirdzijauskas from '@/images/recommendations/henrikas-girdzijauskas.jpeg'
import justeUrbanaviciene from '@/images/recommendations/juste-urbanaviciene.jpeg'
import karolinaRupsiene from '@/images/recommendations/karolina-rupsiene.jpeg'
import mariusZaleskis from '@/images/recommendations/marius-zaleskis.jpeg'
import martinWill from '@/images/recommendations/martin-will.jpeg'
import milanRistic from '@/images/recommendations/milan-ristic.jpeg'
import osmanTuran from '@/images/recommendations/osman-turan.jpeg'
import romanIudin from '@/images/recommendations/roman-iudin.jpeg'
import rytisGrinevicius from '@/images/recommendations/rytis-grinevicius.jpeg'
import simonSattes from '@/images/recommendations/simon-sattes.jpeg'
import tarikElBouyahyani from '@/images/recommendations/tarik-el-bouyahyani.jpeg'
import vilniausUniversitetas from '@/images/universities/vilniaus-universitetas.png'
import { getRequiredValue } from '@/lib/assert'

const companyImages = {
  'anwalt.jpg': anwalt,
  'inlusion.jpg': inlusion,
  'integrus.jpg': integrus,
  'itlogas.jpg': itlogas,
  'olympic.jpg': olympic,
  'profectus-novus.jpg': profectusNovus,
  'scayle.jpg': scayle,
  'solutionlab.jpg': solutionlab,
} satisfies Record<string, StaticImageData>

const recommendationImages = {
  'aleksandr-smailov.jpeg': aleksandrSmailov,
  'aleksei-golda.jpeg': alekseiGolda,
  'andrei-lungu.jpeg': andreiLungu,
  'antonina-stoliarova.jpeg': antoninaStoliarova,
  'arnoldas-starkauskas.jpeg': arnoldasStarkauskas,
  'bianca-della-rosa.jpeg': biancaDellaRosa,
  'daniel-motzev.jpeg': danielMotzev,
  'dimitrij-skorobatov.jpeg': dimitrijSkorobatov,
  'dmitry-sergiets.jpeg': dmitrySergiets,
  'donatas-maikstenas.jpeg': donatasMaikstenas,
  'eugene-bunin.jpeg': eugeneBunin,
  'gintare-kaubryte.jpeg': gintareKaubryte,
  'hans-kreuger.jpeg': hansKreuger,
  'henrikas-girdzijauskas.jpeg': henrikasGirdzijauskas,
  'juste-urbanaviciene.jpeg': justeUrbanaviciene,
  'karolina-rupsiene.jpeg': karolinaRupsiene,
  'marius-zaleskis.jpeg': mariusZaleskis,
  'martin-will.jpeg': martinWill,
  'milan-ristic.jpeg': milanRistic,
  'osman-turan.jpeg': osmanTuran,
  'roman-iudin.jpeg': romanIudin,
  'rytis-grinevicius.jpeg': rytisGrinevicius,
  'simon-sattes.jpeg': simonSattes,
  'tarik-el-bouyahyani.jpeg': tarikElBouyahyani,
} satisfies Record<string, StaticImageData>

function getRegistryImage(
  registry: Record<string, StaticImageData>,
  key: string,
  assetKind: string,
) {
  return getRequiredValue(registry[key], `Missing ${assetKind} image: ${key}`)
}

export function getCompanyImage(imageName: string) {
  return getRegistryImage(companyImages, imageName, 'company')
}

export function getRecommendationImage(imageName: string) {
  return getRegistryImage(recommendationImages, imageName, 'recommendation')
}

export const universityImages = {
  vilniausUniversitetas,
} as const
