import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Empty,
  InputNumber,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
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
  const { message } = App.useApp();
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

      message.success(`${requestedPage}페이지의 인식 상태를 저장했습니다.`);
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  }

  return (
    <Modal
      open
      width={1080}
      title={`PDF 글자 인식${query.data ? ` · ${aiProviderLabel(query.data.provider)} · ${query.data.model}` : ''}`}
      onCancel={onClose}
      footer={null}>
      <div className='flex flex-col gap-5'>
        <Typography.Text strong>{material.title}</Typography.Text>
        <Alert
          type='info'
          title={
            query.data
              ? `현재 공급자 지원 언어: ${supportedLanguages || '없음'}`
              : '지원 언어와 연결 상태를 확인하고 있습니다.'
          }
          description='직접 등록한 원본에서 선택한 한 페이지만 인식합니다. 원본은 유지하고 인식 결과와 영역을 별도로 저장합니다. 페이지를 조회하는 동안에는 OCR을 실행하지 않습니다.'
        />
        <Space wrap>
          <Typography.Text>원본 v{version || '확인 중'}</Typography.Text>
          <Typography.Text>페이지</Typography.Text>
          <InputNumber
            min={1}
            max={material.pageCount ?? 1}
            precision={0}
            value={page}
            disabled={mutation.isPending}
            onChange={(value) => {
              if (value) setPage(value);
            }}
            addonAfter={`/ ${material.pageCount ?? 1}`}
          />
          <Button
            onClick={() => void query.refetch()}
            disabled={!version}
            loading={query.isFetching}>
            저장 상태 조회
          </Button>
          <Button
            type='primary'
            onClick={() => void recognize()}
            loading={busy}
            disabled={
              !query.data?.configured ||
              !query.data.languageSupported ||
              item?.status === 'ready' ||
              !version
            }>
            {item?.status === 'ready'
              ? '저장된 결과'
              : item?.status === 'failed'
                ? '새 요청으로 다시 인식'
                : '이 페이지 글자 인식'}
          </Button>
        </Space>
        {(access.error || query.error) && (
          <Alert
            type='error'
            title={(access.error || query.error)?.message}
          />
        )}
        {query.data && !query.data.configured && (
          <Alert
            type='warning'
            title='OCR 연결 설정이 필요합니다.'
            description='현재 선택된 공급자의 API 서버 연결 설정을 확인해 주세요. 저장된 결과는 계속 조회할 수 있습니다.'
          />
        )}
        {query.data && !query.data.languageSupported && (
          <Alert
            type='warning'
            title='이 자료의 언어는 OCR 지원 범위에 포함되지 않습니다.'
            description='PDF에 포함된 원본 텍스트는 기존 선택 기능으로 학습할 수 있습니다. 지원 언어는 현재 공급자의 안내를 확인해 주세요.'
          />
        )}
        {(access.isPending || (version > 0 && query.isPending)) && <Spin />}
        {item?.status === 'running' && (
          <Alert
            type='info'
            title='선택한 페이지의 글자를 인식하고 있습니다.'
            description='저장 상태를 확인하고 있습니다. 페이지를 바꿔도 해당 요청의 원본과 페이지는 유지됩니다.'
          />
        )}
        {item?.status === 'failed' && (
          <Alert
            type='error'
            title='글자 인식에 실패했습니다.'
            description={
              item.error ??
              '원본과 서버 설정을 확인한 뒤 새 요청으로 다시 실행할 수 있습니다.'
            }
          />
        )}
        {query.data && !item && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description='이 원본 버전과 페이지의 저장된 OCR 결과가 없습니다.'
          />
        )}
        {item?.status === 'ready' && (
          <>
            <Space>
              <Tag color='green'>인식 완료</Tag>
              <Typography.Text type='secondary'>
                {aiProviderLabel(item.provider)} · {item.model}
              </Typography.Text>
              <Typography.Text>
                {item.fields.length}개 영역 · 원본 v{item.version} · {item.page}
                페이지
              </Typography.Text>
            </Space>
            {item.eligibility && !item.eligibility.aiAllowed && (
              <Alert
                type='warning'
                title='새 AI 요청 안내'
                description={item.eligibility.reason}
              />
            )}
            {unknownConfidenceCount > 0 && (
              <Alert
                type='warning'
                title={`신뢰도 미제공 영역 ${unknownConfidenceCount}개`}
                description='공급자가 신뢰도 수치를 제공하지 않았습니다. 정확도를 추정하지 않으며 원본과 대조해 확인해야 합니다.'
              />
            )}
            {item.lowConfidenceCount > 0 && (
              <Alert
                type='warning'
                title={`신뢰도가 낮은 영역이 ${item.lowConfidenceCount}개 있습니다.`}
                description='인식 신뢰도 80% 미만의 영역입니다. 학습·공유하기 전에 학생 화면의 원본과 대조해 주세요.'
              />
            )}
            <Typography.Paragraph
              style={{
                whiteSpace: 'pre-wrap',
                maxHeight: 240,
                overflow: 'auto',
              }}
              copyable>
              {item.text}
            </Typography.Paragraph>
            <Table
              rowKey={(_, index) => String(index)}
              size='small'
              dataSource={item.fields}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              columns={[
                { title: '인식한 원문', dataIndex: 'text', width: '52%' },
                {
                  title: '신뢰도',
                  key: 'confidence',
                  render: (_, field) => (
                    <Tag
                      color={
                        field.confidence === null || field.confidence < 0.8
                          ? 'orange'
                          : 'green'
                      }>
                      {field.confidence === null
                        ? '미제공 · 원본 확인 필요'
                        : `${Math.round(field.confidence * 100)}%`}
                    </Tag>
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
    </Modal>
  );
}
