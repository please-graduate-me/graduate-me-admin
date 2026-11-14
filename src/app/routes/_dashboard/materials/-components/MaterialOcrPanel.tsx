import { useToast } from '@astryxdesign/core/Toast';
import { Text } from '@astryxdesign/core/Text';
import { Banner } from '@astryxdesign/core/Banner';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { Spinner } from '@astryxdesign/core/Spinner';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Badge } from '@astryxdesign/core/Badge';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { Dialog } from '@astryxdesign/core/Dialog';
import { DataTable } from '@/components/ui/DataTable';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiProviderLabel } from '@/domains/operations/lib/providerLabel';
import type { AdminMaterial } from '@/domains/operations/model/contracts';
import { materialAccessQuery } from '@/domains/operations/api/operations';
import { materialOcrQuery, useMaterialOcr } from '@/domains/operations/api/ocr';

/** 운영자가 직접 등록한 PDF의 한 페이지를 명시적으로 인식하고 저장 영역을 검토한다. */
export function MaterialOcrPanel({
  material,
  onClose,
}: {
  material: AdminMaterial;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const access = useQuery(materialAccessQuery('pdf', material.id));
  const version = access.data?.version ?? 0;
  const query = useQuery(materialOcrQuery(material.id, version, page));
  const mutation = useMaterialOcr(material.id);
  const toast = useToast();
  const item = query.data?.item;
  const busy = mutation.isPending || item?.status === 'running';

  const unknownConfidenceCount =
    item?.fields.filter((field) => field.confidence === null).length ?? 0;

  const supportedLanguages = query.data?.supportedLanguages
    .map((language) => (language === 'th' ? '태국어' : '영어'))
    .join(' · ');

  async function recognize() {
    if (busy || !version) return;
    const requestedPage = page;

    try {
      await mutation.mutateAsync({
        requestId: crypto.randomUUID(),
        version,
        page: requestedPage,
      });

      toast({
        type: 'info',
        body: `${requestedPage}페이지의 인식 상태를 저장했습니다.`,
      });
    } catch (error) {
      if (error instanceof Error)
        toast({
          type: 'error',
          body: error.message,
        });
    }
  }

  return (
    <Dialog
      isOpen
      width={1080}
      onOpenChange={onClose}>
      <DialogHeader
        title={`PDF 글자 인식${query.data ? ` · ${aiProviderLabel(query.data.provider)} · ${query.data.model}` : ''}`}
        onOpenChange={onClose}
      />
      <div className='flex flex-col gap-5'>
        <Text weight='semibold'>{material.title}</Text>
        <Banner
          status='info'
          title={
            query.data
              ? `현재 공급자 지원 언어: ${supportedLanguages || '없음'}`
              : '지원 언어와 연결 상태를 확인하고 있습니다.'
          }
          description='직접 등록한 원본에서 선택한 한 페이지만 인식합니다. 원본은 유지하고 인식 결과와 영역을 별도로 저장합니다. 페이지를 조회하는 동안에는 OCR을 실행하지 않습니다.'
        />
        <Stack
          direction='horizontal'
          gap={2}>
          <Text>원본 v{version || '확인 중'}</Text>
          <Text>페이지</Text>
          <NumberInput
            min={1}
            max={material.pageCount ?? 1}
            value={page}
            isDisabled={mutation.isPending}
            onChange={(value) => {
              if (value) setPage(value);
            }}
            label='입력'
            isLabelHidden
          />
          <Button
            onClick={() => void query.refetch()}
            isDisabled={!version}
            isLoading={query.isFetching}
            variant='secondary'
            label='저장 상태 조회'
          />
          <Button
            onClick={() => void recognize()}
            isLoading={busy}
            isDisabled={
              !query.data?.configured ||
              !query.data.languageSupported ||
              item?.status === 'ready' ||
              !version
            }
            variant='primary'
            label={
              item?.status === 'ready'
                ? '저장된 결과'
                : item?.status === 'failed'
                  ? '새 요청으로 다시 인식'
                  : '이 페이지 글자 인식'
            }
          />
        </Stack>
        {(access.error || query.error) && (
          <Banner
            status='error'
            title={(access.error || query.error)?.message}
          />
        )}
        {query.data && !query.data.configured && (
          <Banner
            status='warning'
            title='OCR 연결 설정이 필요합니다.'
            description='현재 선택된 공급자의 API 서버 연결 설정을 확인해 주세요. 저장된 결과는 계속 조회할 수 있습니다.'
          />
        )}
        {query.data && !query.data.languageSupported && (
          <Banner
            status='warning'
            title='이 자료의 언어는 OCR 지원 범위에 포함되지 않습니다.'
            description='PDF에 포함된 원본 텍스트는 기존 선택 기능으로 학습할 수 있습니다. 지원 언어는 현재 공급자의 안내를 확인해 주세요.'
          />
        )}
        {(access.isPending || (version > 0 && query.isPending)) && (
          <Spinner label='불러오는 중' />
        )}
        {item?.status === 'running' && (
          <Banner
            status='info'
            title='선택한 페이지의 글자를 인식하고 있습니다.'
            description='저장 상태를 확인하고 있습니다. 페이지를 바꿔도 해당 요청의 원본과 페이지는 유지됩니다.'
          />
        )}
        {item?.status === 'failed' && (
          <Banner
            status='error'
            title='글자 인식에 실패했습니다.'
            description={
              item.error ??
              '원본과 서버 설정을 확인한 뒤 새 요청으로 다시 실행할 수 있습니다.'
            }
          />
        )}
        {query.data && !item && (
          <EmptyState title='이 원본 버전과 페이지의 저장된 OCR 결과가 없습니다.' />
        )}
        {item?.status === 'ready' && (
          <>
            <Stack
              direction='horizontal'
              gap={2}>
              <Badge
                variant='green'
                label={<>인식 완료</>}
              />
              <Text color='secondary'>
                {aiProviderLabel(item.provider)} · {item.model}
              </Text>
              <Text>
                {item.fields.length}개 영역 · 원본 v{item.version} · {item.page}
                페이지
              </Text>
            </Stack>
            {item.eligibility && !item.eligibility.aiAllowed && (
              <Banner
                status='warning'
                title='새 AI 요청 안내'
                description={item.eligibility.reason}
              />
            )}
            {unknownConfidenceCount > 0 && (
              <Banner
                status='warning'
                title={`신뢰도 미제공 영역 ${unknownConfidenceCount}개`}
                description='공급자가 신뢰도 수치를 제공하지 않았습니다. 정확도를 추정하지 않으며 원본과 대조해 확인해야 합니다.'
              />
            )}
            {item.lowConfidenceCount > 0 && (
              <Banner
                status='warning'
                title={`신뢰도가 낮은 영역이 ${item.lowConfidenceCount}개 있습니다.`}
                description='인식 신뢰도 80% 미만의 영역입니다. 학습·공유하기 전에 학생 화면의 원본과 대조해 주세요.'
              />
            )}
            <Text
              style={{
                whiteSpace: 'pre-wrap',
                maxHeight: 240,
                overflow: 'auto',
              }}
              as='p'>
              {item.text}
            </Text>
            <DataTable
              rowKey={(_, index) => String(index)}
              size='small'
              dataSource={item.fields}
              pagination={{
                mode: 'client',
                pageSize: 10,
                showSizeChanger: false,
              }}
              columns={[
                { title: '인식한 원문', dataIndex: 'text', width: '52%' },
                {
                  title: '신뢰도',
                  key: 'confidence',
                  render: (_, field) => (
                    <Badge
                      variant={
                        field.confidence === null || field.confidence < 0.8
                          ? 'orange'
                          : 'green'
                      }
                      label={
                        <>
                          {field.confidence === null
                            ? '미제공 · 원본 확인 필요'
                            : `${Math.round(field.confidence * 100)}%`}
                        </>
                      }
                    />
                  ),
                },
                {
                  title: '페이지 내 영역 · %',
                  key: 'rect',
                  render: (_, field) =>
                    `왼쪽 ${Math.round(field.rect.x * 100)}, 위 ${Math.round(field.rect.y * 100)}, 너비 ${Math.round(field.rect.width * 100)}, 높이 ${Math.round(field.rect.height * 100)}`,
                },
              ]}
            />
          </>
        )}
      </div>
    </Dialog>
  );
}
